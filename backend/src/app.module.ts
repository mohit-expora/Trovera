import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BooksModule } from './books/books.module';
import { TransactionsModule } from './transactions/transactions.module';
import { RolesModule } from './roles/roles.module';
import { HealthModule } from './health/health.module';
import { ErrorsModule } from './errors/errors.module';
import { TranslateModule } from './translate/translate.module';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        { ttl: 60000, limit: config.get<number>('rateLimit.perMinute', 60) },
      ],
    }),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [{
        rootPath: path.resolve(config.get<string>('uploadDir', './uploads')),
        serveRoot: '/uploads',
        serveStaticOptions: { index: false },
      }],
    }),
    PrismaModule,
    CacheModule,
    AuthModule,
    UsersModule,
    BooksModule,
    TransactionsModule,
    RolesModule,
    HealthModule,
    ErrorsModule,
    TranslateModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
