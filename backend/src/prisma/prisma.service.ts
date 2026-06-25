import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Inject connection_limit into the DATABASE_URL query string rather than relying on
    // prisma.config — this way pool size is controlled entirely via env without schema changes
    const dbUrl = new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/trovera');
    dbUrl.searchParams.set('connection_limit', process.env.DB_POOL_SIZE || '5');

    super({
      datasources: { db: { url: dbUrl.toString() } },
      // In development, log warnings and errors as events (not stdout) so the Logger captures them.
      // In production, only log errors to reduce noise.
      log: process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'error' }, { emit: 'event', level: 'warn' }]
        : [{ emit: 'event', level: 'error' }],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
