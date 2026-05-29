import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Observable } from 'rxjs';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRenderDto } from './renders.dto';

export interface RenderProgressEvent {
  status: 'queued' | 'processing' | 'ready' | 'failed';
  progress: number;
  resultUrl?: string;
  errorMessage?: string;
  costCents?: number;
  provider?: string;
}

@Injectable()
export class RendersService {
  private readonly logger = new Logger(RendersService.name);
  private readonly redisUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue('render.on-model') private readonly renderQueue: Queue,
  ) {
    this.redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
  }

  async create(dto: CreateRenderDto) {
    const garment = await this.prisma.garment.findUnique({
      where: { id: dto.garmentId },
      include: { collection: true },
    });
    if (!garment) throw new NotFoundException(`Garment ${dto.garmentId} not found`);

    const modelRows = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; workspaceId: string; referenceImageUrl: string }>
    >(
      `SELECT id, "workspaceId", "referenceImageUrl" FROM "VirtualModel" WHERE id = $1`,
      dto.virtualModelId,
    );
    const model = modelRows[0];
    if (!model) throw new NotFoundException(`VirtualModel ${dto.virtualModelId} not found`);

    const render = await this.prisma.render.create({
      data: {
        garmentId: dto.garmentId,
        virtualModelId: dto.virtualModelId,
        status: 'queued',
        promptVersion: dto.promptVersion ?? 'v1',
      },
    });

    await this.renderQueue.add('on-model', {
      renderId: render.id,
      garmentId: garment.id,
      flatlayUrl: garment.flatlayUrl,
      virtualModelId: model.id,
      referenceImageUrl: model.referenceImageUrl,
      workspaceId: model.workspaceId,
      promptVersion: render.promptVersion,
      fabric: garment.fabric,
      silhouette: garment.silhouette,
      length: garment.length,
    });

    this.logger.log(`Enqueued render ${render.id}`);
    return render;
  }

  async findOne(id: string) {
    const render = await this.prisma.render.findUnique({ where: { id } });
    if (!render) throw new NotFoundException(`Render ${id} not found`);
    return render;
  }

  /**
   * SSE stream of render progress. Subscribes to Redis pub/sub
   * channel `render:${renderId}:progress` and auto-completes when
   * status becomes 'ready' or 'failed'.
   */
  streamProgress(renderId: string): Observable<{ data: RenderProgressEvent }> {
    return new Observable((subscriber) => {
      const sub = new Redis(this.redisUrl);
      const channel = `render:${renderId}:progress`;

      // Emit current DB state as initial event
      this.prisma.render
        .findUnique({ where: { id: renderId } })
        .then((render) => {
          if (!render) {
            subscriber.error(new NotFoundException(`Render ${renderId} not found`));
            return;
          }
          subscriber.next({
            data: {
              status: render.status as RenderProgressEvent['status'],
              progress: render.status === 'ready' ? 100 : 0,
              resultUrl: render.resultUrl ?? undefined,
              errorMessage: render.errorMessage ?? undefined,
              costCents: render.costCents,
              provider: render.provider ?? undefined,
            },
          });
          if (render.status === 'ready' || render.status === 'failed') {
            subscriber.complete();
            sub.quit();
          }
        })
        .catch((err) => subscriber.error(err));

      sub.subscribe(channel, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${channel}: ${err.message}`);
          subscriber.error(err);
        }
      });

      sub.on('message', (_chan, msg) => {
        try {
          const event = JSON.parse(msg) as RenderProgressEvent;
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
