export type Intent =
  | "garment.on-model"
  | "garment.segment"
  | "garment.attribute-extract"
  | "copy.product-title"
  | "copy.product-description"
  | "copy.hashtags"
  | "size.infer"
  | "video.lookbook"
  | "edit.inpaint"
  | "edit.background-swap";

export interface GenerateOptions {
  region: "CN" | "OVERSEAS";
  preferredProvider?: string;
  consistency?: {
    faceEmbedding: number[];
    bodyEmbedding: number[];
    /**
     * Optional URL to the original reference image. Required by vendors like
     * DashScope that accept a `refImage` URL instead of raw embeddings.
     */
    referenceImageUrl?: string;
  };
  /**
   * Output locale for text generation intents (e.g. copy.*).
   * Defaults to 'zh-CN' when omitted.
   */
  locale?: "zh-CN" | "en-US" | "ja";
  workspaceId: string;
}

export interface GenerateResult {
  resultUrl?: string;
  text?: string;
  costCents: number;
  provider: string;
  raw: unknown;
}
