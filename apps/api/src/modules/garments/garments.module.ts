import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GarmentsController } from './garments.controller';
import { GarmentsService } from './garments.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'garment.segment' })],
  controllers: [GarmentsController],
  providers: [GarmentsService],
  exports: [GarmentsService],
})
export class GarmentsModule {}
