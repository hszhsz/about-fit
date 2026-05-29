import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RendersController } from './renders.controller';
import { RendersService } from './renders.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'render.on-model' })],
  controllers: [RendersController],
  providers: [RendersService],
  exports: [RendersService],
})
export class RendersModule {}
