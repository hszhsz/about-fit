import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CopyController } from './copy.controller';
import { CopyService } from './copy.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'copy.generate' })],
  controllers: [CopyController],
  providers: [CopyService],
  exports: [CopyService],
})
export class CopyModule {}
