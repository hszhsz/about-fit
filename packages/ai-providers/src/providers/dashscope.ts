import type { Intent, GenerateOptions, GenerateResult } from "../types";

/**
 * DashScope provider (Alibaba Cloud - Wanxiang API).
 * Used for garment on-model generation, segmentation, and copy generation in CN region.
 *
 * @see https://dashscope.aliyuncs.com — DashScope Wanxiang API for image generation
 */
export class DashScopeProvider {
  private readonly apiKey: string;

  constructor() {
    const key = process.env["DASHSCOPE_API_KEY"];
    if (!key) {
      throw new Error(
        "DASHSCOPE_API_KEY environment variable is not set",
      );
    }
    this.apiKey = key;
  }

  // TODO: Implement real DashScope Wanxiang API calls for image generation
  async generate(
    intent: Intent,
    payload: unknown,
    options: GenerateOptions,
  ): Promise<GenerateResult> {
    void intent;
    void payload;
    void options;
    throw new Error("DashScopeProvider.generate() not yet implemented");
  }
}
