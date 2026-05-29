import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Sse,
  UsePipes,
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { ZodSchema } from 'zod';
import { RendersService, RenderProgressEvent } from './renders.service';
import { CreateRenderDto } from './renders.dto';
import { Observable } from 'rxjs';

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

@Controller('renders')
export class RendersController {
  constructor(private readonly rendersService: RendersService) {}

  @Post()
  @UsePipes(new ZodPipe(CreateRenderDto))
  create(@Body() dto: CreateRenderDto) {
    return this.rendersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rendersService.findOne(id);
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<{ data: RenderProgressEvent }> {
    return this.rendersService.streamProgress(id);
  }
}
