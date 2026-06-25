import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';

// @Global() makes CacheService injectable anywhere without importing CacheModule per-module.
// Used by HttpCacheInterceptor (global), TranslateService, and TransactionsService.
@Global()
@Module({
  imports: [ConfigModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
