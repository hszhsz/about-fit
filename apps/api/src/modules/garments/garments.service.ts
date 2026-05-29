import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGarmentDto } from './garments.dto';

@Injectable()
export class GarmentsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('garment.segment') private readonly segmentQueue: Queue,
  ) {}

  async findAll(workspaceId?: string) {
    if (workspaceId) {
      return this.prisma.garment.findMany({
        where: { collection: { workspaceId } },
        orderBy: { id: 'desc' },
      });
    }
    return this.prisma.garment.findMany({ orderBy: { id: 'desc' } });
  }

  async findOne(id: string) {
    return this.prisma.garment.findUnique({
      where: { id },
      include: { renders: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async create(dto: CreateGarmentDto) {
    const garment = await this.prisma.garment.create({
      data: {
        collectionId: dto.collectionId,
        sku: dto.sku ?? null,
        flatlayUrl: dto.flatlayUrl,
        status: 'draft',
      },
    });

    // Enqueue segmentation job; worker writes back segmentationMaskUrl + attributes.
    await this.segmentQueue.add('segment', {
      garmentId: garment.id,
      flatlayUrl: garment.flatlayUrl,
    });

    return garment;
  }
}
