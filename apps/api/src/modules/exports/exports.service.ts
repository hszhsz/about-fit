import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Observable } from 'rxjs';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PLATFORM_PRESETS } from '@about-fit/domain';
import type { CreateExportDto } from './exports.dto';

export interface ExportProgressEvent {
  exportId: string;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  doneItems?: number;
  totalItems?: number;
  zipUrl?: string;
  errorMessage?: string;
  /** Per-item update; emitted as the worker finishes each resize. */
  item?: {
    id: string;
    presetId: string;
    status: 'queued' | 'processing' | 'ready' | 'failed';
    outputUrl?: string;
    errorMessage?: string;
  };
}

/**
 * ExportsService — orchestrates multi-platform export batches.
 *
 * Flow:
 *   1. POST /exports collects source images (from explicit renderIds or
 *      garmentId → all ready renders) and creates an Export row plus N
 *      ExportItem rows (one per (source × preset)).
 *   2. Enqueues a single `export.bundle` job; the worker fans out resizes,
 *      uploads each, zips the result, and updates the Export row.
 *   3. Frontend subscribes to SSE `/exports/:id/stream` for per-item +
 *      batch progress, then downloads `zipUrl` when status='ready'.
 */
@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);
  private readonly redisUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue('export.bundle') private readonly queue: Queue,
  ) {
    this.redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
  }

  async create(dto: CreateExportDto) {
    // Resolve source renders → list of {renderId?, sourceUrl}.
    const sources: Array<{ renderId: string | null; sourceUrl: string }> = [];

    if (dto.renderIds && dto.renderIds.length > 0) {
      const renders = await this.prisma.render.findMany({
        where: { id: { in: dto.renderIds }, status: 'ready' },
      });
      if (renders.length !== dto.renderIds.length) {
        throw new BadRequestException(
          `Some renders are missing or not in 'ready' status (got ${renders.length}/${dto.renderIds.length})`,
        );
      }
      for (const r of renders) {
        if (!r.resultUrl) throw new BadRequestException(`Render ${r.id} has no resultUrl`);
        sources.push({ renderId: r.id, sourceUrl: r.resultUrl });
      }
    } else if (dto.garmentId) {
      const renders = await this.prisma.render.findMany({
        where: { garmentId: dto.garmentId, status: 'ready' },
        orderBy: { createdAt: 'desc' },
      });
      if (renders.length === 0) {
        throw new BadRequestException(`No ready renders found for garment ${dto.garmentId}`);
      }
      for (const r of renders) {
        if (r.resultUrl) sources.push({ renderId: r.id, sourceUrl: r.resultUrl });
      }
    }

    const totalItems = sources.length * dto.presets.length;
    if (totalItems > 200) {
      throw new BadRequestException(
        `Too many items: ${totalItems}. Reduce sources or presets (limit 200).`,
      );
    }

    const exportRow = await this.prisma.export.create({
      data: {
        workspaceId: dto.workspaceId,
        garmentId: dto.garmentId ?? null,
        status: 'queued',
        totalItems,
      },
    });

    // Create ExportItem rows.
    for (const src of sources) {
      for (const presetId of dto.presets) {
        const preset = PLATFORM_PRESETS[presetId];
        if (!preset) {
          throw new BadRequestException(`Unknown preset: ${presetId}`);
        }
        await this.prisma.exportItem.create({
          data: {
            exportId: exportRow.id,
            renderId: src.renderId,
            sourceUrl: src.sourceUrl,
            presetId,
            width: preset.size[0],
            height: preset.size[1],
            format: preset.format,
            status: 'queued',
          },
        });
      }
    }

    await this.queue.add('bundle', { exportId: exportRow.id });

    this.logger.log(
      `Enqueued export ${exportRow.id}: ${sources.length} sources × ${dto.presets.length} presets = ${totalItems} items`,
    );
    return exportRow;
  }

  async findOne(id: string) {
    const row = await this.prisma.export.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!row) throw new NotFoundException(`Export ${id} not found`);
    return row;
  }

  async list(workspaceId: string) {
    return this.prisma.export.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { items: true },
    });
  }

  /**
   * SSE stream of export progress. Mirrors RendersService.streamProgress.
   */
  streamProgress(exportId: string): Observable<{ data: ExportProgressEvent }> {
    return new Observable((subscriber) => {
      const sub = new Redis(this.redisUrl);
      const channel = `export:${exportId}:progress`;

      this.prisma.export
        .findUnique({ where: { id: exportId }, include: { items: true } })
        .then((row) => {
          if (!row) {
            subscriber.error(new NotFoundException(`Export ${exportId} not found`));
            return;
          }
          subscriber.next({
            data: {
              exportId,
              status: row.status as ExportProgressEvent['status'],
              doneItems: row.doneItems,
              totalItems: row.totalItems,
              zipUrl: row.zipUrl ?? undefined,
              errorMessage: row.errorMessage ?? undefined,
            },
          });
          if (row.status === 'ready' || row.status === 'failed') {
            subscriber.complete();
            sub.quit();
          }
        })
        .catch((err) => subscriber.error(err));

      sub.subscribe(channel, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe ${channel}: ${err.message}`);
          subscriber.error(err);
        }
      });

      sub.on('message', (_chan, msg) => {
        try {
          const event = JSON.parse(msg) as ExportProgressEvent;
          subscriber.next({ data: event });
          if (event.status === 'ready' || event.status === 'failed') {
            subscriber.complete();
            sub.quit();
          }
        } catch {
          this.logger.warn(`Bad SSE payload on ${channel}: ${msg}`);
        }
      });

      return () => sub.quit();
    });
  }
}
