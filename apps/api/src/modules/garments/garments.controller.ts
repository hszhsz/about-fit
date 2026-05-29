import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { ZodSchema } from 'zod';
import { GarmentsService } from './garments.service';
import { CreateGarmentDto } from './garments.dto';

@Injectable()
class ZodPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}
  transform(value: unknown, _m: ArgumentMetadata): T {
    const r = this.schema.safeParse(value);
    if (!r.success) {
      throw new BadRequestException({ message: 'Validation failed', issues: r.error.issues });
    }
    return r.data;
  }
}

@Controller('garments')
export class GarmentsController {
  constructor(private readonly garmentsService: GarmentsService) {}

  @Get()
  findAll(@Query('workspaceId') workspaceId?: string) {
    return this.garmentsService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.garmentsService.findOne(id);
  }

  @Post()
  @UsePipes(new ZodPipe(CreateGarmentDto))
  create(@Body() dto: CreateGarmentDto) {
    return this.garmentsService.create(dto);
  }
}
