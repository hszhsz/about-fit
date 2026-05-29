import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
// TODO: import { RedisModule } from './redis/redis.module';
// TODO: import { BullModule } from '@nestjs/bullmq';
// TODO: import { AuthModule } from './modules/auth/auth.module';
// TODO: import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { GarmentsModule } from './modules/garments/garments.module';
// TODO: import { VirtualModelsModule } from './modules/virtual-models/virtual-models.module';
import { RendersModule } from './modules/renders/renders.module';
// TODO: import { CopyModule } from './modules/copy/copy.module';
// TODO: import { PlatformsModule } from './modules/platforms/platforms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    GarmentsModule,
    RendersModule,
    // TODO: RedisModule,
    // TODO: BullModule.forRoot({ ... }),
    // TODO: AuthModule,
    // TODO: WorkspacesModule,
    // TODO: VirtualModelsModule,
    // TODO: CopyModule,
    // TODO: PlatformsModule,
  ],
})
export class AppModule {}
