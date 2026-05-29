import { z } from "zod";

export const FabricSchema = z.enum([
  "silk",
  "denim",
  "knit",
  "linen",
  "cotton",
  "wool",
  "polyester",
  "nylon",
  "other",
]);
export type Fabric = z.infer<typeof FabricSchema>;

export const SilhouetteSchema = z.enum([
  "a-line",
  "sheath",
  "oversized",
  "fitted",
  "relaxed",
  "other",
]);
export type Silhouette = z.infer<typeof SilhouetteSchema>;

export const GarmentLengthSchema = z.enum(["mini", "midi", "maxi", "cropped"]);
export type GarmentLength = z.infer<typeof GarmentLengthSchema>;

export const GarmentStatusSchema = z.enum([
  "draft",
  "segmented",
  "ready",
  "rendering",
  "approved",
  "exported",
]);
export type GarmentStatus = z.infer<typeof GarmentStatusSchema>;

export const GarmentSchema = z.object({
  id: z.string(),
  sku: z.string(),
  collectionId: z.string(),
  flatlayUrl: z.string().url(),
  segmentationMaskUrl: z.string().url().optional(),
  fabric: FabricSchema,
  silhouette: SilhouetteSchema,
  length: GarmentLengthSchema,
  status: GarmentStatusSchema,
});
export type Garment = z.infer<typeof GarmentSchema>;
