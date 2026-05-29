import { z } from "zod";

export const PlatformIdSchema = z.enum([
  "taobao-main",
  "taobao-detail",
  "douyin-feed",
  "douyin-cover",
  "shopify-hero",
  "tiktok-shop",
  "amazon-a-plus-banner",
  "amazon-a-plus-square",
  "xiaohongshu",
  "instagram-feed",
  "instagram-story",
]);
export type PlatformId = z.infer<typeof PlatformIdSchema>;

export const PlatformPresetSchema = z.object({
  id: PlatformIdSchema,
  label: z.string(),
  size: z.tuple([z.number(), z.number()]),
  format: z.enum(["jpg", "png", "webp", "mp4"]),
  background: z.union([z.string(), z.literal("transparent")]),
  aspectRatio: z.string().optional(),
  duration: z.tuple([z.number(), z.number()]).optional(),
  fps: z.number().optional(),
});
export type PlatformPreset = z.infer<typeof PlatformPresetSchema>;
