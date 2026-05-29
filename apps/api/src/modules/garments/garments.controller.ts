import { Controller, Get } from '@nestjs/common';
import { GarmentsService } from './garments.service';

// TODO: Add auth guard, workspace scope, upload endpoint, segmentation enqueue

@Controller('garments')
export class GarmentsController {
  constructor(private readonly garmentsService: GarmentsService) {}

  @Get()
  findAll() {
    return this.garmentsService.findAll();
  }
}
