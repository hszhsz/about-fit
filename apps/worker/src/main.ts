import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

import { processSegment } from './workers/segment.worker.js';
import { processRender } from './workers/render.worker.js';
import { processCopy } from './workers/copy.worker.js';
import { processExport } from './workers/export.worker.js';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const workers: Worker[] = [];

function createWorkers() {
  const segmentWorker = new Worker('garment.segment', processSegment, { connection });
  const attributeWorker = new Worker('garment.attribute-extract', async (job) => {
    // TODO: Implement attribute extraction worker
    console.log(`[attribute-extract] Processing job ${job.id}`, job.data);
  }, { connection });
  const renderWorker = new Worker('render.on-model', processRender, { connection });
  const copyWorker = new Worker('copy.generate', processCopy, { connection });
  const exportWorker = new Worker('export.bundle', processExport, { connection });
  const videoWorker = new Worker('video.lookbook', async (job) => {
    // TODO: Implement video lookbook worker
    console.log(`[video.lookbook] Processing job ${job.id}`, job.data);
  }, { connection });

  workers.push(segmentWorker, attributeWorker, renderWorker, copyWorker, exportWorker, videoWorker);
}

async function shutdown() {
  console.log('Shutting down workers...');
  await Promise.all(workers.map((w) => w.close()));
  connection.disconnect();
  console.log('All workers closed. Exiting.');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

createWorkers();
console.log(`AboutFit Worker started — listening on ${workers.length} queues`);
