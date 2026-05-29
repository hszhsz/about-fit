import { z } from 'zod';

export const CopyKindSchema = z.enum(['title', 'description', 'hashtags']);
export type CopyKind = z.infer<typeof CopyKindSchema>;

export const LocaleSchema = z.enum(['zh-CN', 'en-US', 'ja']);
export type Locale = z.infer<typeof LocaleSchema>;

/** Aligned with packages/domain/src/platform.ts PlatformIdSchema */
export const PlatformIdSchema = z.enum([
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
  'generic',
]);
export type PlatformId = z.infer<typeof PlatformIdSchema>;

export const CreateCopyDto = z.object({
  garmentId: z.string().min(1),
  workspaceId: z.string().min(1),
  /** One or more variants to generate in a single request. */
  variants: z
    .array(
      z.object({
        kind: CopyKindSchema,
        platform: PlatformIdSchema.default('generic'),
        locale: LocaleSchema.default('zh-CN'),
      }),
    )
    .min(1)
    .max(12),
  /** Optional extra brief the user types in the right-hand drawer. */
  brief: z.string().max(2000).optional(),
});
export type CreateCopyDto = z.infer<typeof CreateCopyDto>;

export const ListCopiesQuery = z.object({
  garmentId: z.string().optional(),
  workspaceId: z.string().optional(),
  kind: CopyKindSchema.optional(),
  platform: PlatformIdSchema.optional(),
  locale: LocaleSchema.optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});
export type ListCopiesQuery = z.infer<typeof ListCopiesQuery>;
