import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import cuid from 'cuid';
import { PrismaService } from '../../prisma/prisma.service';

interface ModelRow {
  id: string;
  workspaceId: string;
  name: string;
  referenceImageUrl: string;
  createdAt: Date;
}

@Injectable()
export class VirtualModelsService {
  private readonly logger = new Logger(VirtualModelsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    workspaceId: string,
    dto: { name: string; referenceImageUrl: string },
  ): Promise<ModelRow> {
    const id = cuid();
    const { faceEmbedding, bodyEmbedding } = await this.extractEmbeddings(
      dto.referenceImageUrl,
    );

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "VirtualModel" (id, "workspaceId", name, "referenceImageUrl", "faceEmbedding", "bodyEmbedding")
       VALUES ($1, $2, $3, $4, $5::vector, $6::vector)`,
      id,
      workspaceId,
      dto.name,
      dto.referenceImageUrl,
      this.formatVector(faceEmbedding),
      this.formatVector(bodyEmbedding),
    );

    this.logger.log(`Created virtual model ${id} in workspace ${workspaceId}`);

    const rows = await this.prisma.$queryRawUnsafe<ModelRow[]>(
      `SELECT id, "workspaceId", name, "referenceImageUrl", "createdAt"
       FROM "VirtualModel" WHERE id = $1`,
      id,
    );
    const row = rows[0];
    if (!row) {
      throw new Error('Failed to insert virtual model');
    }
    return row;
  }

  async findAll(workspaceId: string): Promise<ModelRow[]> {
    return this.prisma.$queryRawUnsafe<ModelRow[]>(
      `SELECT id, "workspaceId", name, "referenceImageUrl", "createdAt"
       FROM "VirtualModel"
       WHERE "workspaceId" = $1
       ORDER BY "createdAt" DESC`,
      workspaceId,
    );
  }

  async findOne(id: string): Promise<ModelRow> {
    const rows = await this.prisma.$queryRawUnsafe<ModelRow[]>(
      `SELECT id, "workspaceId", name, "referenceImageUrl", "createdAt"
       FROM "VirtualModel" WHERE id = $1`,
      id,
    );
    const row = rows[0];
    if (!row) throw new NotFoundException(`VirtualModel ${id} not found`);
    return row;
  }

  /**
   * Extract face + body embeddings from a reference image URL.
   * M1: returns mock 512-d unit vectors.
   * TODO(M3): replace with InsightFace (face) + MediaPipe (body) inference.
   */
  private async extractEmbeddings(
    _imageUrl: string,
  ): Promise<{ faceEmbedding: number[]; bodyEmbedding: number[] }> {
    return {
      faceEmbedding: this.mockUnitVector(512),
      bodyEmbedding: this.mockUnitVector(512),
    };
  }

  private mockUnitVector(dim: number): number[] {
    const raw = Array.from({ length: dim }, () => Math.random() * 2 - 1);
    const norm = Math.sqrt(raw.reduce((s, x) => s + x * x, 0)) || 1;
    return raw.map((x) => x / norm);
  }

  private formatVector(arr: number[]): string {
    return `[${arr.map((v) => v.toFixed(6)).join(',')}]`;
  }
}
