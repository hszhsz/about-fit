export type { Intent, GenerateOptions, GenerateResult } from "./types";
export { resolveProvider } from "./routing";

import type { Intent, GenerateOptions, GenerateResult } from "./types";

/**
 * Primary entry point for generating AI content.
 * Routes to the appropriate provider based on intent and region.
 */
export async function generate(
  intent: Intent,
  payload: unknown,
  options: GenerateOptions,
): Promise<GenerateResult> {
  // TODO: Load the appropriate provider based on routing config
  // const providerName = resolveProvider(intent, options.region);
  // const provider = loadProvider(providerName);
  // return provider.generate(intent, payload, options);
  throw new Error("Provider not configured");
}
