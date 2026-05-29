import { Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import sharp from 'sharp';
import archiver from 'archiver';
import { PassThrough } from 'node:stream';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PLATFORM_PRESETS, presetFilename, type PlatformId } from '@about-fit/domain';

interface ExportJobData {
  exportId: string;
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
const EXPORTS_BUCKET = process.env.S3_BUCKET_EXPORTS ?? 'about-fit-exports';
const PUBLIC_ENDPOINT =
  process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT ?? 'http://localhost:9000';

/**
 * Process an export.bundle job:
 *   1. Load all ExportItem rows for this Export.
 *   2. For each item:
 *        - download source image,
 *        - resize via sharp to the preset's (w,h) using `cover` fit
 *          + flatten onto the preset's background color,
 *        - convert to the preset's format,
 *        - upload to S3 → outputUrl,
 *        - publish per-item event.
 *   3. Build a zip archive in-memory streamed to S3 (passthrough) so we
 *      never need a temp file on disk; upload as zipUrl.
 *   4. Mark Export ready + publish completion event.
 *
 * On any per-item error: item.status='failed' but the batch continues.
 * The Export is marked 'ready' if at least one item succeeded; otherwise
 * 'failed'. This matches the UX of "some platforms exported, others didn't".
 */
export async function processExport(job: Job<ExportJobData>): Promise<void> {
  const { exportId } = job.data;
  const channel = `export:${exportId}:progress`;
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const pub = new IORedis(redisUrl);
  const publish = (e: object) => pub.publish(channel, JSON.stringify({ exportId, ...e }));

  try {
    await prisma.export.update({
      where: { id: exportId },
      data: { status: 'processing' },
    });
    await publish({ status: 'processing', doneItems: 0 });

    const items = await prisma.exportItem.findMany({ where: { exportId } });
    if (items.length === 0) {
      throw new Error(`Export ${exportId} has no items`);
    }

    // Cache resized buffers so we can both upload them individually AND zip them.
    const succeeded: Array<{ filename: string; buffer: Buffer }> = [];
    let doneItems = 0;

    for (const item of items) {
      try {
        await prisma.exportItem.update({
          where: { id: item.id },
          data: { status: 'processing' },
        });

        const preset = PLATFORM_PRESETS[item.presetId as PlatformId];
        if (!preset) throw new Error(`Unknown preset: ${item.presetId}`);

        const buffer = await resizeToPreset(item.sourceUrl, preset);
        const baseSlug = `r-${item.renderId ?? item.id.slice(0, 6)}`;
        const filename = presetFilename(baseSlug, item.presetId as PlatformId, 1, preset.format);
        const key = `exports/${exportId}/${filename}`;

        await s3.send(
          new PutObjectCommand({
            Bucket: EXPORTS_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimeFor(preset.format),
          }),
        );
        const outputUrl = `${PUBLIC_ENDPOINT}/${EXPORTS_BUCKET}/${key}`;

        await prisma.exportItem.update({
          where: { id: item.id },
          data: { status: 'ready', outputUrl },
        });

        succeeded.push({ filename, buffer });
        doneItems += 1;
        await prisma.export.update({
          where: { id: exportId },
          data: { doneItems },
        });
        await publish({
          status: 'processing',
          doneItems,
          totalItems: items.length,
          item: {
            id: item.id,
            presetId: item.presetId,
            status: 'ready',
            outputUrl,
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[export.bundle] item ${item.id} failed: ${msg}`);
        await prisma.exportItem.update({
          where: { id: item.id },
          data: { status: 'failed', errorMessage: msg },
        });
        await publish({
          status: 'processing',
          doneItems,
          totalItems: items.length,
          item: {
            id: item.id,
            presetId: item.presetId,
            status: 'failed',
            errorMessage: msg,
          },
        });
      }
    }

    if (succeeded.length === 0) {
      throw new Error('All items failed; nothing to bundle');
    }

    // Bundle into zip.
    await publish({ status: 'processing', doneItems, totalItems: items.length });
    const zipKey = `exports/${exportId}/bundle.zip`;
    const zipUrl = await uploadZip(zipKey, succeeded);

    await prisma.export.update({
      where: { id: exportId },
      data: { status: 'ready', zipUrl, doneItems },
    });
    await publish({
      status: 'ready',
      doneItems,
      totalItems: items.length,
      zipUrl,
    });
    console.log(`[export.bundle] ✓ ${exportId} → ${succeeded.length}/${items.length} items, zip=${zipUrl}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[export.bundle] ✗ ${exportId}: ${message}`);
    await prisma.export.update({
      where: { id: exportId },
      data: { status: 'failed', errorMessage: message },
    });
    await publish({ status: 'failed', errorMessage: message });
    throw err;
  } finally {
    pub.disconnect();
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function resizeToPreset(
  sourceUrl: string,
  preset: { size: readonly [number, number] | [number, number]; format: string; background: string },
): Promise<Buffer> {
  const resp = await axios.get<ArrayBuffer>(sourceUrl, {
    responseType: 'arraybuffer',
    timeout: 60_000,
  });
  const input = Buffer.from(resp.data);
  const [w, h] = preset.size;

  // Background fill: 'transparent' or a hex color like '#FFFFFF'.
  const bg = preset.background === 'transparent'
    ? { r: 0, g: 0, b: 0, alpha: 0 }
    : hexToRgba(preset.background);

  let pipeline = sharp(input)
    .resize({ width: w, height: h, fit: 'cover', position: 'attention' })
    .flatten({ background: bg });

  switch (preset.format) {
    case 'jpg':
      pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 9 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: 90 });
      break;
    default:
      throw new Error(`Unsupported preset format: ${preset.format}`);
  }
  return pipeline.toBuffer();
}

function hexToRgba(hex: string): { r: number; g: number; b: number; alpha: number } {
  const clean = hex.replace('#', '');
  const n = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return { r, g, b, alpha: 1 };
}

function mimeFor(format: string): string {
  return format === 'jpg' ? 'image/jpeg'
    : format === 'png' ? 'image/png'
    : format === 'webp' ? 'image/webp'
    : 'application/octet-stream';
}

/**
 * Stream a zip through a PassThrough into S3 PutObject.
 * Returns the public URL of the uploaded bundle.
 *
 * NOTE: We buffer into memory here (totalBytes typically <50MB for image
 * batches). For very large exports M5+ should switch to multipart upload.
 */
async function uploadZip(
  key: string,
  files: Array<{ filename: string; buffer: Buffer }>,
): Promise<string> {
  const chunks: Buffer[] = [];
  const pass = new PassThrough();
  pass.on('data', (c: Buffer) => chunks.push(c));

  const archive = archiver('zip', { zlib: { level: 9 } });
  const finished = new Promise<void>((resolve, reject) => {
    archive.on('error', reject);
    pass.on('end', resolve);
    pass.on('error', reject);
  });

  archive.pipe(pass);
  for (const f of files) {
    archive.append(f.buffer, { name: f.filename });
  }
  await archive.finalize();
  await finished;

  const zipBuffer = Buffer.concat(chunks);
  await s3.send(
    new PutObjectCommand({
      Bucket: EXPORTS_BUCKET,
      Key: key,
      Body: zipBuffer,
      ContentType: 'application/zip',
      ContentDisposition: `attachment; filename="aboutfit-export.zip"`,
    }),
  );
  return `${PUBLIC_ENDPOINT}/${EXPORTS_BUCKET}/${key}`;
}
