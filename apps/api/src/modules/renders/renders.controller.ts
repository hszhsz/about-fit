import { Controller, Post, Get, Param, Body, Sse } from '@nestjs/common';
import { RendersService } from './renders.service';

// TODO: Add auth guard, workspace scope, request DTO validation
// TODO: Implement SSE stream via Redis pub/sub on render:${id}:progress

@Controller('renders')
export class RendersController {
  constructor(private readonly rendersService: RendersService) {}

  @Post()
  create(@Body() body: { garmentId: string; virtualModelId: string }) {
    // TODO: Validate DTO, enqueue BullMQ job
    return this.rendersService.create(body);
  }

  @Get(':id/stream')
  stream(@Param('id') id: string) {
    // TODO: Return SSE observable subscribing to Redis pub/sub channel
    // For now return a placeholder
    return this.rendersService.findOne(id);
  }
}
