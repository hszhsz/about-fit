import { Module } from '@nestjs/common';
import { RendersController } from './renders.controller';
import { RendersService } from './renders.service';

// TODO: Add BullMQ queue registration, Redis pub/sub for SSE

@Module({
  controllers: [RendersController],
  providers: [RendersService],
  exports: [RendersService],
})
export class RendersModule {}
