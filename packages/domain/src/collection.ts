import { z } from "zod";

export const CollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  season: z.string(),
  workspaceId: z.string(),
});
export type Collection = z.infer<typeof CollectionSchema>;
