import { z } from "zod";

export const VirtualModelSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  referenceImageUrl: z.string().url(),
  faceEmbedding: z.array(z.number()),
  bodyEmbedding: z.array(z.number()),
});
export type VirtualModel = z.infer<typeof VirtualModelSchema>;
