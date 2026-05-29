import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UsePipes,
  PipeTransform,
  Injectable,
  ArgumentMetadata,
} from '@nestjs/common';
import { z, ZodSchema } from 'zod';
import { StorageService } from '../../storage/storage.service';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const PresignBodySchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  kind: z.enum(['garment-flatlay', 'virtual-model-reference']),
});
type PresignBody = z.infer<typeof PresignBodySchema>;

@Injectable()
class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}
  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        issues: parsed.error.issues,
      });
    }
    return parsed.data;
  }
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post('presign')
  @UsePipes(new ZodValidationPipe(PresignBodySchema))
  async presign(
    @Body() body: PresignBody,
  ): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
    if (!ALLOWED_TYPES.has(body.contentType)) {
      throw new BadRequestException('Unsupported content type');
    }
    const ext = EXT_BY_TYPE[body.contentType] ?? 'bin';
    const prefix =
      body.kind === 'virtual-model-reference' ? 'models' : 'garments';
    const key = this.storage.generateKey(prefix, ext);
    const { url, publicUrl } = await this.storage.getPresignedUploadUrl(
      key,
      body.contentType,
      'uploads',
    );
    return { uploadUrl: url, publicUrl, key };
  }
}
