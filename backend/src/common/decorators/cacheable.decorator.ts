import { SetMetadata, applyDecorators } from '@nestjs/common';
import { Request } from 'express';

export const CACHE_KEY_FN_META = 'cache:key_fn';
export const CACHE_TTL_META = 'cache:ttl';
export const CACHE_EVICT_META = 'cache:evict_patterns';

type EvictTarget = string | ((req: Request) => string | string[]);

export const Cacheable = (keyFn: (req: Request) => string, ttl: number) =>
  applyDecorators(
    SetMetadata(CACHE_KEY_FN_META, keyFn),
    SetMetadata(CACHE_TTL_META, ttl),
  );

export const CacheEvict = (...patterns: EvictTarget[]) =>
  SetMetadata(CACHE_EVICT_META, patterns);
