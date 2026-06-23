import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { CacheService } from '../../cache/cache.service';
import { CACHE_KEY_FN_META, CACHE_TTL_META, CACHE_EVICT_META } from '../decorators/cacheable.decorator';

type EvictTarget = string | ((req: Request) => string | string[]);

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
      if (cached !== null) return of(cached);

      return next.handle().pipe(
        tap(async (response) => {
          await this.cache.set(key, response, ttl);
        }),
      );
    }

    if (evictTargets?.length) {
      return next.handle().pipe(
        tap(async () => {
          const patterns = evictTargets.flatMap((t) =>
            typeof t === 'function' ? [t(request)].flat() : [t],
          );
          await Promise.all(patterns.map((p) => this.cache.deletePattern(p)));
        }),
      );
    }

    return next.handle();
  }
}
