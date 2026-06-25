import { SetMetadata, applyDecorators } from '@nestjs/common';
import { Request } from 'express';

export const CACHE_KEY_FN_META = 'cache:key_fn';
export const CACHE_TTL_META = 'cache:ttl';
export const CACHE_EVICT_META = 'cache:evict_patterns';

type EvictTarget = string | ((req: Request) => string | string[]);

// Marks a GET endpoint for caching. HttpCacheInterceptor reads these metadata keys,
// checks Redis before hitting the handler, and stores the response after.
// keyFn receives the request so the cache key can include dynamic values (url, params, query).
// Example: @Cacheable((req) => `book:${req.params.id}`, 600)
export const Cacheable = (keyFn: (req: Request) => string, ttl: number) =>
  applyDecorators(
    SetMetadata(CACHE_KEY_FN_META, keyFn),
    SetMetadata(CACHE_TTL_META, ttl),
  );

// Marks a mutating endpoint (POST/PATCH/DELETE) to evict Redis keys after success.
// Patterns support wildcards — e.g. 'books:list:*' deletes all paginated book lists at once.
// A function pattern receives the request so you can evict by dynamic ID.
// Example: @CacheEvict((req) => `book:${req.params.id}`, 'books:list:*')
export const CacheEvict = (...patterns: EvictTarget[]) =>
  SetMetadata(CACHE_EVICT_META, patterns);
