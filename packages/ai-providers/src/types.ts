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
  };
  workspaceId: string;
}

export interface GenerateResult {
  resultUrl?: string;
  text?: string;
  costCents: number;
  provider: string;
  raw: unknown;
}
