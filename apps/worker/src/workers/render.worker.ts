import { Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import cuid from 'cuid';
import { generate } from '@about-fit/ai-providers';

interface RenderJobData {
  renderId: string;
  garmentId: string;
  virtualModelId: string;
  workspaceId: string;
  flatlayUrl: string;
  referenceImageUrl: string;
  promptVersion: string;
  fabric?: string | null;
  silhouette?: string | null;
  length?: string | null;
}

const prisma = new PrismaClient();

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  region: process.env.S3_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? 'aboutfit',
    secretAccessKey: process.env.S3_SECRET_KEY ?? 'aboutfit-dev-secret',
  },
  forcePathStyle: true,
});
const RENDERS_BUCKET = process.env.S3_BUCKET_RENDERS ?? 'about-fit-renders';
const PUBLIC_ENDPOINT = process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT ?? 'http://localhost:9000';

/**
 * Process render.on-model job:
 *   1. Mark render as processing.
 *   2. Build prompt from garment attributes.
 *   3. Call DashScope wanx2.1-imageedit with reference image for consistency.
 *   4. Download generated image and re-host on our S3 (so we own the URL).
 *   5. Update Render row + publish SSE events.
 */
export async function processRender(job: Job<RenderJobData>): Promise<void> {
  const {
    renderId,
    flatlayUrl,
    referenceImageUrl,
    workspaceId,
    promptVersion,
    fabric,
    silhouette,
    length,
  } = job.data;

  const channel = `render:${renderId}:progress`;
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const pub = new IORedis(redisUrl);

  const publish = (e: object) => pub.publish(channel, JSON.stringify(e));

  try {
    await prisma.render.update({
      where: { id: renderId },
      data: { status: 'processing' },
    });
    await publish({ status: 'processing', progress: 5 });

    // Build prompt from garment attributes
    const attrs = [
      fabric ? `${fabric} fabric` : null,
      silhouette ? `${silhouette} silhouette` : null,
      length ? `${length} length` : null,
    ].filter(Boolean).join(', ');

    const prompt = [
      'editorial fashion photography, full-body on-model shot of a fashion model wearing the garment from the reference flat-lay',
      attrs ? `garment details: ${attrs}` : '',
      'natural studio lighting, soft shadows, neutral background, sharp focus, 35mm lens',
      'preserve garment silhouette and fabric texture exactly',
    ].filter(Boolean).join('. ');

    await publish({ status: 'processing', progress: 20 });

    // Call DashScope through ai-providers adapter
    const result = await generate(
      'garment.on-model',
      {
        prompt,
        baseImageUrl: flatlayUrl,
        n: 1,
      },
      {
        region: 'CN',
        workspaceId,
        consistency: { referenceImageUrl },
        preferredProvider: 'dashscope',
      },
    );

    await publish({ status: 'processing', progress: 70 });

    if (!result.resultUrl) {
      throw new Error('Provider returned no resultUrl');
    }

    // Re-host the image so the URL is on our domain and won't expire
    const finalUrl = await rehost(result.resultUrl, renderId);

    await prisma.render.update({
      where: { id: renderId },
      data: {
        status: 'ready',
        resultUrl: finalUrl,
        provider: result.provider,
        costCents: result.costCents,
      },
    });

    await publish({
      status: 'ready',
      progress: 100,
      resultUrl: finalUrl,
      provider: result.provider,
      costCents: result.costCents,
    });

    console.log(`[render.on-model] ✓ ${renderId} → ${finalUrl}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[render.on-model] ✗ ${renderId}: ${message}`);
    await prisma.render.update({
      where: { id: renderId },
      data: { status: 'failed', errorMessage: message },
    });
    await publish({ status: 'failed', progress: 0, errorMessage: message });
    throw err;
  } finally {
    pub.disconnect();
  }
}

/**
 * Download an image from a provider URL and re-upload to our S3 bucket.
 * Returns the public URL on our domain.
 */
async function rehost(sourceUrl: string, renderId: string): Promise<string> {
  const response = await axios.get<ArrayBuffer>(sourceUrl, {
    responseType: 'arraybuffer',
    timeout: 60_000,
  });
  const contentType = response.headers['content-type'] ?? 'image/png';
  const ext = contentType.includes('jpeg') ? 'jpg' : contentType.includes('webp') ? 'webp' : 'png';
  const key = `renders/${renderId}-${cuid()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: RENDERS_BUCKET,
      Key: key,
      Body: Buffer.from(response.data),
      ContentType: contentType,
    }),
  );

  return `${PUBLIC_ENDPOINT}/${RENDERS_BUCKET}/${key}`;
}
