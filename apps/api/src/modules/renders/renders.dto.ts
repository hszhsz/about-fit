import { z } from 'zod';

export const CreateRenderDto = z.object({
  garmentId: z.string().min(1),
  virtualModelId: z.string().min(1),
  promptVersion: z.string().default('v1'),
});
export type CreateRenderDto = z.infer<typeof CreateRenderDto>;
