import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  it('tryAcquireLock returns true when REDIS_URL unset', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService, { provide: ConfigService, useValue: { get: () => undefined } }],
    }).compile();
    const service = module.get(RedisService);
    await expect(service.tryAcquireLock('k', 10)).resolves.toBe(true);
    await service.onModuleDestroy();
  });
});
