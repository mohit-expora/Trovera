import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

// TTL in seconds for each cache category. Keep these in sync with business expectations:
// - BOOKS_LIST/BOOK_DETAIL: short because librarians update inventory frequently
// - CATEGORIES/PERMISSIONS/TRANSLATIONS: long because they change rarely
// - JTI_BLACKLIST: must be >= the session max-age so invalidated sessions stay blacklisted
export const TTL = {
  BOOKS_LIST: 300,      // 5 min
  BOOK_DETAIL: 600,     // 10 min
  CATEGORIES: 3600,     // 1 hour
  USER_DETAIL: 600,     // 10 min
  OVERDUE: 120,         // 2 min (stale overdue list would affect fine calculation)
  DASHBOARD: 120,       // 2 min
  PERMISSIONS: 900,     // 15 min
  JTI_BLACKLIST: 86400, // 24 hours
  TRANSLATIONS: 86400,  // 24 hours
};

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: ReturnType<typeof createClient>;

  constructor(private config: ConfigService) {
    const redisUrl = config.get<string>('redis.url', 'redis://localhost:6379/0');
    this.client = createClient({ url: redisUrl });
    this.client.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));
    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.connect().catch((err) => this.logger.warn(`Redis connect failed: ${err.message}`));
  }

  // Errors are swallowed so a Redis outage degrades gracefully (cache miss → DB fallback)
  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await this.client.get(key);
      return val ? (JSON.parse(val.toString()) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err) {
      this.logger.warn(`Cache set failed for ${key}: ${err.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {}
  }

  async exists(key: string): Promise<boolean> {
    try {
      return Number(await this.client.exists(key)) > 0;
    } catch {
      return false;
    }
  }

  // Uses KEYS (not SCAN) — simpler but blocks Redis on large key sets.
  // Acceptable here because wildcard evictions happen infrequently and the key space is small.
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch {}
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  onModuleDestroy() {
    this.client.quit().catch(() => {});
  }
}
