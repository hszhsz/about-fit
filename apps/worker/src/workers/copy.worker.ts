import { Job } from 'bullmq';

interface CopyJobData {
  garmentId: string;
  workspaceId: string;
  locale: string;
  type: 'title' | 'description' | 'hashtags';
}

interface CopyResult {
  text: string;
}

/**
 * Processor for the "copy.generate" queue.
 * Generates AI-powered marketing copy for garment listings.
 */
export async function processCopy(job: Job<CopyJobData>): Promise<CopyResult> {
  const { garmentId, workspaceId, locale, type } = job.data;

  console.log(`[copy.generate] Generating ${type} for garment ${garmentId} (workspace=${workspaceId}, locale=${locale})`);

  // TODO: Integrate DashScope Qwen for real AI copy generation
  return { text: 'AI-generated copy placeholder' };
}
