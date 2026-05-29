import { z } from "zod";

export const BrandKitSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  tone: z.object({
    adjectives: z.array(z.string()),
    voice: z.string(),
  }),
  palette: z.object({
    primary: z.string(),
    accent: z.string(),
    background: z.string(),
  }),
  bannedWords: z.array(z.string()),
  hashtags: z.array(z.string()),
});
export type BrandKit = z.infer<typeof BrandKitSchema>;
