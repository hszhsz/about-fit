import { z } from "zod";

export const RenderStatusSchema = z.enum([
  "queued",
  "processing",
  "ready",
  "failed",
]);
export type RenderStatus = z.infer<typeof RenderStatusSchema>;

export const RenderSchema = z.object({
  id: z.string(),
  garmentId: z.string(),
  virtualModelId: z.string(),
  status: RenderStatusSchema,
  provider: z.string(),
  costCents: z.number(),
  promptVersion: z.string(),
  resultUrl: z.string().url().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type Render = z.infer<typeof RenderSchema>;
