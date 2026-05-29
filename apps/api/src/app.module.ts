import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { GarmentsModule } from './modules/garments/garments.module';
import { VirtualModelsModule } from './modules/virtual-models/virtual-models.module';
import { RendersModule } from './modules/renders/renders.module';
// TODO(M2+): AuthModule, WorkspacesModule, CopyModule, PlatformsModule

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        const parsed = new URL(url);
        return {
          connection: {
            host: parsed.hostname,
            port: Number(parsed.port || 6379),
            password: parsed.password || undefined,
            db: parsed.pathname && parsed.pathname.length > 1
              ? Number(parsed.pathname.slice(1))
              : 0,
          },
        };
      },
    }),
    PrismaModule,
    StorageModule,
    HealthModule,
    UploadsModule,
    GarmentsModule,
    VirtualModelsModule,
    RendersModule,
  ],
})
export class AppModule {}
