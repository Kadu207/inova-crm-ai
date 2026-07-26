import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { LgpdService } from '../lgpd/lgpd.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { RedisService } from '../redis/redis.service';

const LOCK_SLA = 'crm:cron:sla';
const LOCK_LGPD = 'crm:cron:lgpd';
/** Slightly under 1h so next hourly tick can acquire. */
const LOCK_SLA_TTL_SEC = 50 * 60;
/** Slightly under 24h so next daily tick can acquire. */
const LOCK_LGPD_TTL_SEC = 23 * 60 * 60;

@Injectable()
export class PlatformJobsService {
  private readonly logger = new Logger(PlatformJobsService.name);
  private readonly cronEnabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly opportunities: OpportunitiesService,
    private readonly lgpd: LgpdService,
  ) {
    const raw = this.config.get<string>('CRON_ENABLED', 'true');
    this.cronEnabled = raw !== 'false' && raw !== '0';
  }

  @Cron(process.env.CRON_SLA_EXPR || '0 * * * *')
  async runSlaCheck(): Promise<void> {
    if (!this.cronEnabled) {
      return;
    }
    const acquired = await this.redis.tryAcquireLock(LOCK_SLA, LOCK_SLA_TTL_SEC);
    if (!acquired) {
      this.logger.debug('SLA cron skipped — lock held by another instance');
      return;
    }
    this.logger.log('SLA cron started');
    try {
      const result = await this.opportunities.checkSlaAll();
      this.logger.log(
        `SLA cron finished: tenants=${result.tenants} checked=${result.checked} breached=${result.breached.length}`,
      );
    } catch (err) {
      this.logger.error('SLA cron failed', err instanceof Error ? err.stack : err);
    }
  }

  @Cron(process.env.CRON_LGPD_EXPR || '0 3 * * *')
  async runLgpdPurge(): Promise<void> {
    if (!this.cronEnabled) {
      return;
    }
    const acquired = await this.redis.tryAcquireLock(LOCK_LGPD, LOCK_LGPD_TTL_SEC);
    if (!acquired) {
      this.logger.debug('LGPD purge cron skipped — lock held by another instance');
      return;
    }
    this.logger.log('LGPD purge cron started');
    try {
      const result = await this.lgpd.purgeExpired();
      const total = Object.values(result.purged).reduce((a, b) => a + b, 0);
      this.logger.log(`LGPD purge cron finished: total=${total} cutoff=${result.cutoff}`);
    } catch (err) {
      this.logger.error('LGPD purge cron failed', err instanceof Error ? err.stack : err);
    }
  }
}
