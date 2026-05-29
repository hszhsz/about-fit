import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// TODO: Integrate BullMQ job enqueue for render.on-model queue
// TODO: Add Redis pub/sub subscription for SSE streaming

@Injectable()
export class RendersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { garmentId: string; virtualModelId: string }) {
    return this.prisma.render.create({
      data: {
        garmentId: data.garmentId,
        virtualModelId: data.virtualModelId,
        promptVersion: 'v1', // TODO: resolve from config
      },
    });
  }

  findOne(id: string) {
    return this.prisma.render.findUnique({ where: { id } });
  }
}
