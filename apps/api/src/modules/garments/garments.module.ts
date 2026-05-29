import { Module } from '@nestjs/common';
import { GarmentsController } from './garments.controller';
import { GarmentsService } from './garments.service';

// TODO: Add guards, interceptors, and DTO validation pipes

@Module({
  controllers: [GarmentsController],
  providers: [GarmentsService],
  exports: [GarmentsService],
})
export class GarmentsModule {}
