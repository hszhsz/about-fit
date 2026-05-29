import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { ZodSchema } from 'zod';
import { VirtualModelsService } from './virtual-models.service';
import { CreateVirtualModelDto } from './virtual-models.dto';

@Injectable()
class ZodPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}
  transform(value: unknown, _meta: ArgumentMetadata): T {
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

@Controller('workspaces/:workspaceId/models')
export class VirtualModelsController {
  constructor(private readonly service: VirtualModelsService) {}

  @Get()
  list(@Param('workspaceId') workspaceId: string) {
    return this.service.findAll(workspaceId);
  }

  @Post()
  @UsePipes(new ZodPipe(CreateVirtualModelDto))
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateVirtualModelDto,
  ) {
    return this.service.create(workspaceId, dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
