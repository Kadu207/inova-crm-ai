import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

type ThrottleRecord = {
  totalHits: number;
  timeToExpire: number;
};

/**
 * Redis-backed ThrottlerStorage for multi-instance API.
 * Used when REDIS_URL is set; otherwise Nest uses in-memory storage.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly redis: Redis;
  private readonly prefix = 'crm:throttle:';

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    this.redis.on('error', (err) => {
      this.logger.warn(`Redis throttler error: ${err.message}`);
    });
  }

  async increment(key: string, ttl: number): Promise<ThrottleRecord> {
    const redisKey = `${this.prefix}${key}`;
    const ttlMs = ttl;
    const multi = this.redis.multi();
    multi.incr(redisKey);
    multi.pttl(redisKey);
    const results = await multi.exec();
    const totalHits = Number(results?.[0]?.[1] ?? 1);
    let pttl = Number(results?.[1]?.[1] ?? -1);

    if (pttl < 0) {
      await this.redis.pexpire(redisKey, ttlMs);
      pttl = ttlMs;
    }

    return {
      totalHits,
      timeToExpire: Math.ceil(pttl / 1000),
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit().catch(() => undefined);
  }
}
