import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PlatformJobsService } from './platform-jobs.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { LgpdService } from '../lgpd/lgpd.service';
import { RedisService } from '../redis/redis.service';

describe('PlatformJobsService', () => {
  let service: PlatformJobsService;
  let opportunities: { checkSlaAll: jest.Mock };
  let lgpd: { purgeExpired: jest.Mock };
  let redis: { tryAcquireLock: jest.Mock };

  async function create(cronEnabled = 'true'): Promise<void> {
    opportunities = {
      checkSlaAll: jest.fn().mockResolvedValue({ tenants: 1, checked: 2, breached: [] }),
    };
    lgpd = {
      purgeExpired: jest.fn().mockResolvedValue({
        cutoff: '2026-01-01T00:00:00.000Z',
        purged: {
          leads: 1,
          companies: 0,
          contacts: 0,
          products: 0,
          services: 0,
          tasks: 0,
          opportunities: 0,
        },
      }),
    };
    redis = { tryAcquireLock: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformJobsService,
        {
          provide: ConfigService,
          useValue: {
            get: (k: string, d?: string) => (k === 'CRON_ENABLED' ? cronEnabled : d),
          },
        },
        { provide: RedisService, useValue: redis },
        { provide: OpportunitiesService, useValue: opportunities },
        { provide: LgpdService, useValue: lgpd },
      ],
    }).compile();

    service = module.get(PlatformJobsService);
  }

  it('runSlaCheck calls checkSlaAll when lock acquired', async () => {
    await create('true');
    await service.runSlaCheck();
    expect(redis.tryAcquireLock).toHaveBeenCalledWith('crm:cron:sla', 50 * 60);
    expect(opportunities.checkSlaAll).toHaveBeenCalled();
  });

  it('runSlaCheck skips when lock not acquired', async () => {
    await create('true');
    redis.tryAcquireLock.mockResolvedValue(false);
    await service.runSlaCheck();
    expect(opportunities.checkSlaAll).not.toHaveBeenCalled();
  });

  it('runSlaCheck no-ops when CRON_ENABLED=false', async () => {
    await create('false');
    await service.runSlaCheck();
    expect(redis.tryAcquireLock).not.toHaveBeenCalled();
    expect(opportunities.checkSlaAll).not.toHaveBeenCalled();
  });

  it('runLgpdPurge calls purgeExpired when lock acquired', async () => {
    await create('true');
    await service.runLgpdPurge();
    expect(redis.tryAcquireLock).toHaveBeenCalledWith('crm:cron:lgpd', 23 * 60 * 60);
    expect(lgpd.purgeExpired).toHaveBeenCalled();
  });
});
