import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'trovera-backend' };
  }

  @Get('health/readiness')
  async readiness() {
    const checks: Record<string, any> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'ok' };
    } catch (err) {
      checks.database = { status: 'error', message: err.message };
    }

    try {
      checks.redis = { status: (await this.cache.ping()) ? 'ok' : 'error' };
    } catch (err) {
      checks.redis = { status: 'error', message: err.message };
    }

    const allOk = Object.values(checks).every((c: any) => c.status === 'ok');
    return { status: allOk ? 'ok' : 'degraded', timestamp: new Date().toISOString(), checks };
  }
}
