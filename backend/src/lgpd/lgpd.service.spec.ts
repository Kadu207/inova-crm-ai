import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LgpdService } from './lgpd.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LgpdService', () => {
  let service: LgpdService;
  const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
  const tx = {
    company: { deleteMany },
    contact: { deleteMany },
    lead: { deleteMany },
    opportunity: { deleteMany },
    task: { deleteMany },
    product: { deleteMany },
    service: { deleteMany },
  };
  const prisma = {
    tenant: { findMany: jest.fn() },
    withTenant: jest.fn((_tenantId: string, fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  const config = { get: jest.fn((key: string, def?: string) => def) };

  beforeEach(async () => {
    jest.clearAllMocks();
    deleteMany.mockResolvedValue({ count: 0 });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LgpdService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(LgpdService);
  });

  it('purgeExpired hard-deletes soft-deleted rows per tenant via withTenant', async () => {
    config.get.mockImplementation((key: string, def?: string) =>
      key === 'LGPD_PURGE_RETENTION_DAYS' ? '30' : def,
    );
    prisma.tenant.findMany.mockResolvedValue([{ id: 't1' }, { id: 't2' }]);
    deleteMany
      .mockResolvedValueOnce({ count: 1 }) // t1 company
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 2 }) // t1 lead
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValue({ count: 0 }); // t2 all zeros

    const result = await service.purgeExpired();

    expect(result.retentionDays).toBe(30);
    expect(result.purged.companies).toBe(1);
    expect(result.purged.leads).toBe(2);
    expect(prisma.tenant.findMany).toHaveBeenCalled();
    expect(prisma.withTenant).toHaveBeenCalledTimes(2);
    expect(prisma.withTenant).toHaveBeenCalledWith('t1', expect.any(Function));
    expect(prisma.withTenant).toHaveBeenCalledWith('t2', expect.any(Function));
    expect(deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 't1',
          deletedAt: expect.objectContaining({ lte: expect.any(Date) }),
        }),
      }),
    );
  });
});
