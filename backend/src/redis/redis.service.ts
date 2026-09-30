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

  /**
   * Spec 031 — claim idempotency key (Redis SET NX).
   * Returns `claimed` on first sight; `duplicate` if already processed.
   * When Redis is unset: in-memory Map (single-process dev only).
   * On handler failure, call `releaseIdempotency` so retries can re-claim.
   */
  async claimIdempotency(
    tenantId: string,
    idempotencyKey: string,
    ttlSeconds = 7 * 24 * 60 * 60,
  ): Promise<'claimed' | 'duplicate'> {
    const key = idempotencyRedisKey(tenantId, idempotencyKey);
    if (!this.client) {
      if (memoryIdempotency.has(key)) {
        return 'duplicate';
      }
      memoryIdempotency.add(key);
      return 'claimed';
    }
    const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK' ? 'claimed' : 'duplicate';
  }

  async releaseIdempotency(tenantId: string, idempotencyKey: string): Promise<void> {
    const key = idempotencyRedisKey(tenantId, idempotencyKey);
    if (!this.client) {
      memoryIdempotency.delete(key);
      return;
    }
    await this.client.del(key);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit().catch(() => undefined);
  }
}

function idempotencyRedisKey(tenantId: string, idempotencyKey: string): string {
  return `crm:idem:${tenantId}:${idempotencyKey}`;
}

const memoryIdempotency = new Set<string>();
