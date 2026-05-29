import { Job } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { generate } from '@about-fit/ai-providers';

type CopyKind = 'title' | 'description' | 'hashtags';
type Locale = 'zh-CN' | 'en-US' | 'ja';

interface CopyJobData {
  copyId: string;
  garmentId: string;
  workspaceId: string;
  kind: CopyKind;
  platform: string;
  locale: Locale;
  brief?: string | null;
  fabric?: string | null;
  silhouette?: string | null;
  length?: string | null;
  sku?: string | null;
}

const prisma = new PrismaClient();

/**
 * Map (kind, platform) → constraints we inject into the prompt so the model
 * respects each surface's idiomatic style and length limits.
 *
 * NOTE: These are intentionally short heuristics for M2. M5 can promote them
 * into a YAML config (config/platform-copy.yaml) shared with the frontend.
 */
function platformGuidance(kind: CopyKind, platform: string, locale: Locale): string {
  const isCN = locale === 'zh-CN';
  switch (platform) {
    case 'taobao-main':
    case 'taobao-detail':
      return kind === 'title'
        ? (isCN
            ? '淘宝标题:不超过60字符,前置核心卖点和关键属性词,避免特殊符号。'
            : 'Taobao title: <60 chars, lead with core selling point and key attributes.')
        : kind === 'hashtags'
          ? '8-12 个搜索关键词,空格分隔,不带#号。'
          : '淘宝商品详情:3-5 段,突出材质、版型、场景、洗护。';
    case 'douyin-feed':
    case 'douyin-cover':
      return kind === 'title'
        ? '抖音种草口吻、有钩子、≤30字、可带1-2个emoji。'
        : kind === 'hashtags'
          ? '5-8 个抖音热门话题标签,带#号,空格分隔。'
          : '抖音种草文案:口语化、有故事感、3-5 句。';
    case 'xiaohongshu':
      return kind === 'title'
        ? '小红书标题:20字内、emoji开头、痛点+利益点。'
        : kind === 'hashtags'
          ? '6-10 个小红书话题,带#号,生活方式+品类混合。'
          : '小红书笔记:第一人称、分点列举、emoji 分段、200-300 字。';
    case 'shopify-hero':
    case 'tiktok-shop':
    case 'amazon-a-plus-banner':
    case 'amazon-a-plus-square':
    case 'instagram-feed':
    case 'instagram-story':
      return kind === 'title'
        ? 'Concise English product title, <70 chars, brand-neutral, sentence case.'
        : kind === 'hashtags'
          ? '8-12 English hashtags, space-separated, lowercase, leading #.'
          : 'English product description: 2-3 short paragraphs, lead with benefit.';
    default:
      return kind === 'title'
        ? (isCN ? '简洁有力的商品标题。' : 'Concise product title.')
        : kind === 'hashtags'
          ? (isCN ? '6-10 个相关标签,逗号分隔。' : '6-10 relevant tags, comma-separated.')
          : (isCN ? '2-4 段产品描述。' : '2-4 short product paragraphs.');
  }
}

function intentOf(kind: CopyKind): 'copy.product-title' | 'copy.product-description' | 'copy.hashtags' {
  switch (kind) {
    case 'title':
      return 'copy.product-title';
    case 'description':
      return 'copy.product-description';
    case 'hashtags':
      return 'copy.hashtags';
  }
}

/**
 * Process a copy.generate job:
 *   1. Mark Copy row processing + publish event.
 *   2. Build a prompt from garment attributes + optional user brief +
 *      platform/locale-specific guidance.
 *   3. Call qwen-max via @about-fit/ai-providers.
 *   4. Persist text + status='ready' and publish completion event.
 */
export async function processCopy(job: Job<CopyJobData>): Promise<void> {
  const {
    copyId,
    garmentId,
    workspaceId,
    kind,
    platform,
    locale,
    brief,
    fabric,
    silhouette,
    length,
    sku,
  } = job.data;

  const channel = `copy:${copyId}:progress`;
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const pub = new IORedis(redisUrl);
  const publish = (e: object) => pub.publish(channel, JSON.stringify({ copyId, ...e }));

  try {
    await prisma.copy.update({
      where: { id: copyId },
      data: { status: 'processing' },
    });
    await publish({ status: 'processing' });

    const attrs = [
      sku ? `SKU: ${sku}` : null,
      fabric ? `面料/Fabric: ${fabric}` : null,
      silhouette ? `版型/Silhouette: ${silhouette}` : null,
      length ? `长度/Length: ${length}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const guidance = platformGuidance(kind, platform, locale);
    const briefBlock = brief ? `\n\n用户额外要求 / Extra brief:\n${brief}` : '';

    const userPrompt = [
      `请为以下服装生成${kindLabel(kind, locale)},投放平台 = ${platform},语言 = ${locale}。`,
      '',
      '服装属性:',
      attrs || '(无显式属性,按通用服装处理)',
      '',
      `平台规范: ${guidance}`,
      briefBlock,
      '',
      '只输出最终文案本身,不要任何解释、引号或前后缀。',
    ].join('\n');

    const result = await generate(
      intentOf(kind),
      { prompt: userPrompt, temperature: 0.85, maxTokens: 600 },
      {
        region: 'CN',
        workspaceId,
        locale,
        preferredProvider: 'dashscope',
      },
    );

    const text = (result.text ?? '').trim();
    if (!text) throw new Error('Provider returned empty text');

    await prisma.copy.update({
      where: { id: copyId },
      data: {
        status: 'ready',
        text,
        provider: result.provider,
        costCents: result.costCents,
      },
    });

    await publish({
      status: 'ready',
      text,
      provider: result.provider,
      costCents: result.costCents,
    });

    console.log(`[copy.generate] ✓ ${copyId} (${kind}/${platform}/${locale}) ${text.length} chars`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[copy.generate] ✗ ${copyId}: ${message}`);
    await prisma.copy.update({
      where: { id: copyId },
      data: { status: 'failed', errorMessage: message },
    });
    await publish({ status: 'failed', errorMessage: message });
    throw err;
  } finally {
    pub.disconnect();
  }
}

function kindLabel(kind: CopyKind, locale: Locale): string {
  if (locale === 'zh-CN') {
    return kind === 'title' ? '商品标题' : kind === 'description' ? '商品描述' : '话题标签';
  }
  if (locale === 'ja') {
    return kind === 'title' ? '商品タイトル' : kind === 'description' ? '商品説明' : 'ハッシュタグ';
  }
  return kind === 'title' ? 'product title' : kind === 'description' ? 'product description' : 'hashtags';
}
