import { z } from 'zod';

export const CreateVirtualModelDto = z.object({
  name: z.string().min(1).max(100),
  referenceImageUrl: z.string().url(),
});
export type CreateVirtualModelDto = z.infer<typeof CreateVirtualModelDto>;
