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
import { ExportsService, ExportProgressEvent } from './exports.service';
import { CreateExportDto } from './exports.dto';

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

@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Post()
  @UsePipes(new ZodPipe(CreateExportDto))
  create(@Body() dto: CreateExportDto) {
    return this.exportsService.create(dto);
  }

  @Get()
  list(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) throw new BadRequestException('workspaceId is required');
    return this.exportsService.list(workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exportsService.findOne(id);
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<{ data: ExportProgressEvent }> {
    return this.exportsService.streamProgress(id);
  }
}
