import { z } from 'zod';

const PlatformIdSchema = z.enum([
  'taobao-main',
  'taobao-detail',
  'douyin-feed',
  'douyin-cover',
  'shopify-hero',
  'tiktok-shop',
  'amazon-a-plus-banner',
  'amazon-a-plus-square',
  'xiaohongshu',
  'instagram-feed',
  'instagram-story',
]);

/**
 * Create an export batch. Either:
 *   - `renderIds`: explicit list of Render rows to export, OR
 *   - `garmentId`: take all `ready` renders for this garment.
 * At least one of them must be provided.
 */
export const CreateExportDto = z
  .object({
    workspaceId: z.string().min(1),
    garmentId: z.string().optional(),
    renderIds: z.array(z.string().min(1)).max(50).optional(),
    presets: z.array(PlatformIdSchema).min(1).max(11),
  })
  .refine((v) => v.garmentId || (v.renderIds && v.renderIds.length > 0), {
    message: 'Provide either garmentId or renderIds',
    path: ['garmentId'],
  });
export type CreateExportDto = z.infer<typeof CreateExportDto>;
