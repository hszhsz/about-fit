import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Observable } from 'rxjs';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateCopyDto, ListCopiesQuery } from './copy.dto';

export interface CopyProgressEvent {
  copyId: string;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  text?: string;
  errorMessage?: string;
  costCents?: number;
  provider?: string;
}

/**
 * CopyService — orchestrates marketing-copy generation jobs.
 *
 * Flow:
 *   1. POST /copy           → create N Copy rows (one per variant) in status='queued'
 *                              and enqueue one BullMQ job per row.
 *   2. The `copy.generate` worker runs qwen-max via @about-fit/ai-providers,
 *      writes back text + status, and publishes events on
 *      Redis channel `copy:${copyId}:progress`.
 *   3. SSE /copy/batch/:batchId/stream multiplexes events for a batch of copies.
 *
 * For M2 we expose per-copy SSE only (`/copy/:id/stream`). Batch SSE is a
 * thin client-side fan-out (the frontend opens one EventSource per copy id).
 */
@Injectable()
export class CopyService {
  private readonly logger = new Logger(CopyService.name);
  private readonly redisUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue('copy.generate') private readonly queue: Queue,
  ) {
    this.redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
  }

  /**
   * Create one Copy row per variant and enqueue a generation job for each.
   * Returns the list of created Copy rows (still in `queued` status).
   */
  async create(dto: CreateCopyDto) {
    const garment = await this.prisma.garment.findUnique({
      where: { id: dto.garmentId },
    });
    if (!garment) throw new NotFoundException(`Garment ${dto.garmentId} not found`);

    const created = [] as Array<Awaited<ReturnType<typeof this.prisma.copy.create>>>;

    for (const v of dto.variants) {
      const row = await this.prisma.copy.create({
        data: {
          garmentId: dto.garmentId,
          workspaceId: dto.workspaceId,
          kind: v.kind,
          platform: v.platform,
          locale: v.locale,
          status: 'queued',
        },
      });
      created.push(row);

      await this.queue.add('generate', {
        copyId: row.id,
        garmentId: garment.id,
        workspaceId: dto.workspaceId,
        kind: v.kind,
        platform: v.platform,
        locale: v.locale,
        brief: dto.brief ?? null,
        fabric: garment.fabric,
        silhouette: garment.silhouette,
        length: garment.length,
        sku: garment.sku,
      });
    }

    this.logger.log(
      `Enqueued ${created.length} copy job(s) for garment ${dto.garmentId}`,
    );
    return created;
  }

  async findOne(id: string) {
    const row = await this.prisma.copy.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Copy ${id} not found`);
    return row;
  }

  async list(q: ListCopiesQuery) {
    return this.prisma.copy.findMany({
      where: {
        ...(q.garmentId ? { garmentId: q.garmentId } : {}),
        ...(q.workspaceId ? { workspaceId: q.workspaceId } : {}),
        ...(q.kind ? { kind: q.kind } : {}),
        ...(q.platform ? { platform: q.platform } : {}),
        ...(q.locale ? { locale: q.locale } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: q.limit,
    });
  }

  /**
   * SSE stream for a single Copy row. Mirrors RendersService.streamProgress
   * but on channel `copy:${copyId}:progress`.
   */
  streamProgress(copyId: string): Observable<{ data: CopyProgressEvent }> {
    return new Observable((subscriber) => {
      const sub = new Redis(this.redisUrl);
      const channel = `copy:${copyId}:progress`;

      this.prisma.copy
        .findUnique({ where: { id: copyId } })
        .then((row) => {
          if (!row) {
            subscriber.error(new NotFoundException(`Copy ${copyId} not found`));
            return;
          }
          subscriber.next({
            data: {
              copyId,
              status: row.status as CopyProgressEvent['status'],
              text: row.text ?? undefined,
              errorMessage: row.errorMessage ?? undefined,
              costCents: row.costCents,
              provider: row.provider ?? undefined,
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
          const event = JSON.parse(msg) as CopyProgressEvent;
          subscriber.next({ data: event });
          if (event.status === 'ready' || event.status === 'failed') {
            subscriber.complete();
            sub.quit();
          }
        } catch {
          this.logger.warn(`Bad SSE payload on ${channel}: ${msg}`);
        }
      });

      return () => {
        sub.quit();
      };
    });
  }
}
