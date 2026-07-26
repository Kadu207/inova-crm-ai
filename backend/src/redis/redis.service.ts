import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Shared Redis client for locks / cache (not domain events).
 * When REDIS_URL is unset, lock helpers no-op and always acquire (single-process dev).
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL');
    if (!url) {
      this.client = null;
      this.logger.warn('REDIS_URL unset — cron locks disabled (always acquire)');
      return;
    }
    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    this.client.on('error', (err) => {
      this.logger.warn(`Redis error: ${err.message}`);
    });
  }

  /**
   * SET key NX with TTL (seconds). Returns true if this process acquired the lock.
   */
  async tryAcquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client) {
      return true;
    }
    const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit().catch(() => undefined);
  }
}
