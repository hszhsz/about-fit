import axios, { AxiosInstance, AxiosError } from "axios";
import type { Intent, GenerateOptions, GenerateResult } from "../types";

/**
 * DashScope provider (Alibaba Cloud — 通义 / Wanxiang API).
 *
 * Used in CN region for:
 *   - Image generation/editing (通义万相 wanx2.1-imageedit) — async task pattern.
 *   - Subject-consistent image generation (虚拟模特一致性, via refImage).
 *   - Copy generation (qwen-max) — synchronous text-generation endpoint.
 *
 * Auth: `Authorization: Bearer <DASHSCOPE_API_KEY>`
 *
 * @see https://help.aliyun.com/zh/dashscope/                            Overview
 * @see https://help.aliyun.com/zh/dashscope/developer-reference/api-details  qwen-max
 * @see https://help.aliyun.com/zh/dashscope/developer-reference/wanx-image-editing-api  wanx2.1-imageedit
 * @see https://help.aliyun.com/zh/dashscope/developer-reference/asynchronous-task-api   async task pattern
 */
export class DashScopeProvider {
  public readonly name = "dashscope" as const;

  private static readonly BASE_URL = "https://dashscope.aliyuncs.com/api/v1";
  /** Image generation cost ~0.2 CNY = 20 fen */
  private static readonly IMAGE_COST_CENTS = 20;
  /** Text (qwen-max) cost ~0.05 CNY = 5 fen */
  private static readonly TEXT_COST_CENTS = 5;
  private static readonly REQUEST_TIMEOUT_MS = 30_000;

  private readonly http: AxiosInstance;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error(
        "DashScopeProvider requires a non-empty apiKey (DASHSCOPE_API_KEY).",
      );
    }
    this.http = axios.create({
      baseURL: DashScopeProvider.BASE_URL,
      timeout: DashScopeProvider.REQUEST_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // Image generation
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Generate an image for the given intent. Supports:
   *   - garment.on-model     → virtual model wearing a garment
   *   - edit.inpaint         → masked region inpainting
   *   - edit.background-swap → replace background
   *
   * Uses DashScope's async task pattern: POST creates a task, then we poll
   * GET /tasks/{task_id} until status is SUCCEEDED.
   *
   * @see https://help.aliyun.com/zh/dashscope/developer-reference/wanx-image-editing-api
   */
  async generateImage(
    intent: Intent,
    payload: {
      prompt: string;
      baseImageUrl?: string;
      maskImageUrl?: string;
      negativePrompt?: string;
      n?: number;
      size?: string;
    },
    opts: GenerateOptions,
  ): Promise<GenerateResult> {
    const model = "wanx2.1-imageedit";
    const fn = this.mapIntentToFunction(intent);

    // TODO(consistency): DashScope's wanx editing models accept a `refImage`
    // URL (NOT raw embeddings). When the caller passes `opts.consistency`, we
    // need EITHER:
    //   (a) the original reference image URL stored alongside the embedding —
    //       currently surfaced as `opts.consistency.referenceImageUrl`, OR
    //   (b) switch to a vendor that accepts raw embeddings directly, e.g.
    //       Replicate IP-Adapter / InstantID for overseas, or train an
    //       internal adapter that materialises the embedding back into an
    //       image. Until then we just forward `referenceImageUrl` when given.
    const refImage = opts.consistency?.referenceImageUrl;

    const input: Record<string, unknown> = {
      prompt: payload.prompt,
      function: fn,
    };
    if (payload.baseImageUrl) input["base_image_url"] = payload.baseImageUrl;
    if (payload.maskImageUrl) input["mask_image_url"] = payload.maskImageUrl;
    if (refImage) input["ref_image_url"] = refImage;

    const parameters: Record<string, unknown> = {
      n: payload.n ?? 1,
    };
    if (payload.size) parameters["size"] = payload.size;
    if (payload.negativePrompt)
      parameters["negative_prompt"] = payload.negativePrompt;

    const taskId = await this.submitTask(model, input, parameters);
    const { resultUrl, raw } = await this.pollTask(taskId);

    return {
      resultUrl,
      costCents: DashScopeProvider.IMAGE_COST_CENTS * (payload.n ?? 1),
      provider: this.name,
      raw,
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // Text generation
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Generate text (product copy) using qwen-max via the synchronous
   * /services/aigc/text-generation/generation endpoint.
   *
   * @see https://help.aliyun.com/zh/dashscope/developer-reference/api-details
   */
  async generateText(
    intent: Intent,
    payload: {
      prompt: string;
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
    },
    opts: GenerateOptions,
  ): Promise<GenerateResult> {
    const model = "qwen-max";
    const locale = opts.locale ?? "zh-CN";

    const systemPrompt =
      payload.systemPrompt ?? this.defaultSystemPrompt(intent, locale);

    const body = {
      model,
      input: {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: payload.prompt },
        ],
      },
      parameters: {
        result_format: "message",
        max_tokens: payload.maxTokens ?? 512,
        temperature: payload.temperature ?? 0.8,
      },
    };

    try {
      const resp = await this.http.post(
        "/services/aigc/text-generation/generation",
        body,
      );
      const data = resp.data;
      const text: string =
        data?.output?.choices?.[0]?.message?.content ??
        data?.output?.text ??
        "";
      if (!text) {
        throw new Error(
          `DashScope qwen-max returned empty content: ${JSON.stringify(data)}`,
        );
      }
      return {
        text,
        costCents: DashScopeProvider.TEXT_COST_CENTS,
        provider: this.name,
        raw: data,
      };
    } catch (err) {
      throw this.wrapError(err, "qwen-max text generation failed");
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Submit an async task to DashScope. Returns the `task_id`.
   *
   * NOTE: The async endpoints require the `X-DashScope-Async: enable` header.
   *
   * @see https://help.aliyun.com/zh/dashscope/developer-reference/asynchronous-task-api
   */
  private async submitTask(
    model: string,
    input: Record<string, unknown>,
    parameters: Record<string, unknown>,
  ): Promise<string> {
    const body = { model, input, parameters };
    try {
      const resp = await this.http.post(
        "/services/aigc/image2image/image-synthesis",
        body,
        { headers: { "X-DashScope-Async": "enable" } },
      );
      const taskId: string | undefined = resp.data?.output?.task_id;
      if (!taskId) {
        throw new Error(
          `DashScope submitTask returned no task_id: ${JSON.stringify(resp.data)}`,
        );
      }
      return taskId;
    } catch (err) {
      throw this.wrapError(err, `submitTask(${model}) failed`);
    }
  }

  /**
   * Poll an async task until it reaches a terminal state.
   * Returns the first result URL plus the raw task payload.
   *
   * @param taskId         DashScope task identifier returned by submitTask.
   * @param maxWaitMs      Maximum total wait before timing out (default 120s).
   * @param pollIntervalMs Delay between polls (default 2s).
   */
  private async pollTask(
    taskId: string,
    maxWaitMs = 120_000,
    pollIntervalMs = 2_000,
  ): Promise<{ resultUrl: string; raw: unknown }> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < maxWaitMs) {
      let data: any;
      try {
        const resp = await this.http.get(`/tasks/${taskId}`);
        data = resp.data;
      } catch (err) {
        throw this.wrapError(err, `pollTask(${taskId}) request failed`);
      }

      const status: string | undefined = data?.output?.task_status;
      if (status === "SUCCEEDED") {
        const url: string | undefined =
          data?.output?.results?.[0]?.url ??
          data?.output?.results?.[0]?.image_url;
        if (!url) {
          throw new Error(
            `DashScope task ${taskId} SUCCEEDED but no result url: ${JSON.stringify(data)}`,
          );
        }
        return { resultUrl: url, raw: data };
      }
      if (status === "FAILED" || status === "CANCELED" || status === "UNKNOWN") {
        const msg =
          data?.output?.message ??
          data?.output?.code ??
          "unknown failure";
        throw new Error(
          `DashScope task ${taskId} terminal status=${status}: ${msg}`,
        );
      }

      // PENDING | RUNNING → keep polling.
      await sleep(pollIntervalMs);
    }

    throw new Error(
      `DashScope task ${taskId} timed out after ${maxWaitMs}ms`,
    );
  }

  private mapIntentToFunction(intent: Intent): string {
    // wanx2.1-imageedit `function` enum:
    //   stylization_all, stylization_local, description_edit,
    //   description_edit_with_mask, remove_watermark, expand,
    //   super_resolution, colorization, doodle, control_cartoon_feature
    // @see https://help.aliyun.com/zh/dashscope/developer-reference/wanx-image-editing-api
    switch (intent) {
      case "garment.on-model":
        return "stylization_all";
      case "edit.inpaint":
        return "description_edit_with_mask";
      case "edit.background-swap":
        return "description_edit";
      default:
        return "stylization_all";
    }
  }

  private defaultSystemPrompt(intent: Intent, locale: string): string {
    const lang =
      locale === "en-US"
        ? "English"
        : locale === "ja"
          ? "Japanese"
          : "Simplified Chinese";
    switch (intent) {
      case "copy.product-title":
        return `You write concise, conversion-oriented e-commerce product titles in ${lang}. Output a single line, no quotes.`;
      case "copy.product-description":
        return `You write engaging e-commerce product descriptions in ${lang}. 2-4 short paragraphs.`;
      case "copy.hashtags":
        return `You produce a comma-separated list of relevant social hashtags in ${lang}. No leading text, hashtags only.`;
      default:
        return `Respond in ${lang}.`;
    }
  }

  private wrapError(err: unknown, context: string): Error {
    if (axios.isAxiosError(err)) {
      const ax = err as AxiosError<any>;
      const status = ax.response?.status ?? "no-status";
      const body =
        typeof ax.response?.data === "string"
          ? ax.response.data
          : JSON.stringify(ax.response?.data ?? {});
      return new Error(
        `[DashScope] ${context}: HTTP ${status} ${ax.message} :: ${body}`,
      );
    }
    if (err instanceof Error) {
      return new Error(`[DashScope] ${context}: ${err.message}`);
    }
    return new Error(`[DashScope] ${context}: ${String(err)}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
