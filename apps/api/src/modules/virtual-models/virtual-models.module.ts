import { Module } from '@nestjs/common';
import { VirtualModelsController } from './virtual-models.controller';
import { VirtualModelsService } from './virtual-models.service';

@Module({
  controllers: [VirtualModelsController],
  providers: [VirtualModelsService],
  exports: [VirtualModelsService],
})
export class VirtualModelsModule {}
