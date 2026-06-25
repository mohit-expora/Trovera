import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

// Both endpoints are excluded from the api/v1 prefix (see main.ts setGlobalPrefix exclude list)
// so load balancers and Docker health checks can reach them without the versioned path.
@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  // Liveness probe — returns 200 if the process is running (no dependency checks)
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'trovera-backend' };
  }

  // Readiness probe — checks DB and Redis before reporting ready.
  // Returns 200 with status:'degraded' (not 503) so the caller can distinguish degraded vs down.
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
