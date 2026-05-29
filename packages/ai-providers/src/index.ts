export type { Intent, GenerateOptions, GenerateResult } from "./types";
export { resolveProvider } from "./routing";
export { DashScopeProvider } from "./providers/dashscope";

import type { Intent, GenerateOptions, GenerateResult } from "./types";
import { resolveProvider } from "./routing";
import { DashScopeProvider } from "./providers/dashscope";

/**
 * Primary entry point for generating AI content.
 * Routes to the appropriate provider based on intent and region,
 * then dispatches to the provider's image or text method based on the
 * intent prefix.
 */
export async function generate(
  intent: Intent,
  payload: unknown,
  options: GenerateOptions,
): Promise<GenerateResult> {
  const providerName =
    options.preferredProvider ?? resolveProvider(intent, options.region);

  const isText = intent.startsWith("copy.");

  switch (providerName) {
    case "dashscope": {
      const apiKey = process.env["DASHSCOPE_API_KEY"];
      if (!apiKey) {
        throw new Error(
          "DASHSCOPE_API_KEY environment variable is not set",
        );
      }
      const provider = new DashScopeProvider(apiKey);
      if (isText) {
        return provider.generateText(
          intent,
          payload as Parameters<DashScopeProvider["generateText"]>[1],
          options,
        );
      }
      return provider.generateImage(
        intent,
        payload as Parameters<DashScopeProvider["generateImage"]>[1],
        options,
      );
    }
    default:
      throw new Error(
        `Provider not configured: ${providerName} (intent=${intent}, region=${options.region})`,
      );
  }
}
