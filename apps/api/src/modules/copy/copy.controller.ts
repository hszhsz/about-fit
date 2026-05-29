import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Sse,
  UsePipes,
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { ZodSchema } from 'zod';
import { Observable } from 'rxjs';
import { CopyService, CopyProgressEvent } from './copy.service';
import { CreateCopyDto, ListCopiesQuery } from './copy.dto';

@Injectable()
class ZodPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}
  transform(value: unknown, _m: ArgumentMetadata): T {
    const r = this.schema.safeParse(value);
    if (!r.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        issues: r.error.issues,
      });
    }
    return r.data;
  }
}

@Controller('copy')
export class CopyController {
  constructor(private readonly copyService: CopyService) {}

  @Post()
  @UsePipes(new ZodPipe(CreateCopyDto))
  create(@Body() dto: CreateCopyDto) {
    return this.copyService.create(dto);
  }

  @Get()
  list(@Query(new ZodPipe(ListCopiesQuery)) q: ListCopiesQuery) {
    return this.copyService.list(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.copyService.findOne(id);
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<{ data: CopyProgressEvent }> {
    return this.copyService.streamProgress(id);
  }
}
