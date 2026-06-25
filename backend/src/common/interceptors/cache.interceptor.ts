import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { CacheService } from '../../cache/cache.service';
import { CACHE_KEY_FN_META, CACHE_TTL_META, CACHE_EVICT_META } from '../decorators/cacheable.decorator';

type EvictTarget = string | ((req: Request) => string | string[]);

// Global interceptor that powers @Cacheable and @CacheEvict decorators.
// Registered as APP_INTERCEPTOR in AppModule so it runs on every request.
//
// Flow for @Cacheable endpoints (GET):
//   1. Compute cache key from keyFn(request)
//   2. If key exists in Redis → return cached value immediately (handler never called)
//   3. Otherwise → run handler → store response in Redis with TTL
//
// Flow for @CacheEvict endpoints (POST/PATCH/DELETE):
//   1. Run handler normally
//   2. After success → delete all matching Redis key patterns
//   3. Pattern wildcards (e.g. 'books:list:*') are resolved via Redis SCAN + DEL
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    private cache: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const keyFn = this.reflector.get<((req: Request) => string) | undefined>(
      CACHE_KEY_FN_META,
      context.getHandler(),
    );
    const ttl = this.reflector.get<number>(CACHE_TTL_META, context.getHandler());
    const evictTargets = this.reflector.get<EvictTarget[]>(CACHE_EVICT_META, context.getHandler());

    const request = context.switchToHttp().getRequest<Request>();

    if (keyFn) {
      const key = keyFn(request);
      const cached = await this.cache.get(key);

      // Cache hit — short-circuit, handler is never executed
      if (cached !== null) return of(cached);

      // Cache miss — run handler and store result
      return next.handle().pipe(
        tap(async (response) => {
          await this.cache.set(key, response, ttl);
        }),
      );
    }

    if (evictTargets?.length) {
      // Run the mutation first, then evict on success
      // tap only runs if the handler completes without throwing
      return next.handle().pipe(
        tap(async () => {
          const patterns = evictTargets.flatMap((t) =>
            typeof t === 'function' ? [t(request)].flat() : [t],
          );
          await Promise.all(patterns.map((p) => this.cache.deletePattern(p)));
        }),
      );
    }

    // No cache metadata — pass through unchanged
    return next.handle();
  }
}
