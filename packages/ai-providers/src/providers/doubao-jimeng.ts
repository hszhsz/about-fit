import type { Intent, GenerateOptions, GenerateResult } from "../types";

/**
 * Doubao Jimeng (即梦) provider — ByteDance's video/image generation service.
 * Used primarily for video.lookbook generation in CN region.
 */
export class DoubaoJimengProvider {
  private readonly apiKey: string;

  constructor() {
    const key = process.env["JIMENG_API_KEY"];
    if (!key) {
      throw new Error(
        "JIMENG_API_KEY environment variable is not set",
      );
    }
    this.apiKey = key;
  }

  // TODO: Implement real Jimeng API calls for video generation
  async generate(
    intent: Intent,
    payload: unknown,
    options: GenerateOptions,
  ): Promise<GenerateResult> {
    void intent;
    void payload;
    void options;
    throw new Error("DoubaoJimengProvider.generate() not yet implemented");
  }
}
