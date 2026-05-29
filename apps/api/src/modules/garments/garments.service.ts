import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// TODO: Add upload handling, segmentation enqueue, attribute extraction

@Injectable()
export class GarmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.garment.findMany();
  }
}
