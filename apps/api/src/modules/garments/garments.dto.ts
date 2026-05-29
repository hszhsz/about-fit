import { z } from 'zod';

export const CreateGarmentDto = z.object({
  collectionId: z.string().min(1),
  sku: z.string().max(64).optional(),
  flatlayUrl: z.string().url(),
});
export type CreateGarmentDto = z.infer<typeof CreateGarmentDto>;
