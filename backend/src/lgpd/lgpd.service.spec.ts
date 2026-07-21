import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LgpdService } from './lgpd.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LgpdService', () => {
  let service: LgpdService;
  const prisma = {
    company: { deleteMany: jest.fn() },
    contact: { deleteMany: jest.fn() },
    lead: { deleteMany: jest.fn() },
    opportunity: { deleteMany: jest.fn() },
    task: { deleteMany: jest.fn() },
    product: { deleteMany: jest.fn() },
    service: { deleteMany: jest.fn() },
  };
  const config = { get: jest.fn((key: string, def?: string) => def) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LgpdService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(LgpdService);
  });

  it('purgeExpired hard-deletes soft-deleted rows past retention', async () => {
    config.get.mockImplementation((key: string, def?: string) =>
      key === 'LGPD_PURGE_RETENTION_DAYS' ? '30' : def,
    );
    prisma.company.deleteMany.mockResolvedValue({ count: 1 });
    prisma.contact.deleteMany.mockResolvedValue({ count: 0 });
    prisma.lead.deleteMany.mockResolvedValue({ count: 2 });
    prisma.opportunity.deleteMany.mockResolvedValue({ count: 0 });
    prisma.task.deleteMany.mockResolvedValue({ count: 0 });
    prisma.product.deleteMany.mockResolvedValue({ count: 0 });
    prisma.service.deleteMany.mockResolvedValue({ count: 0 });

    const result = await service.purgeExpired();

    expect(result.retentionDays).toBe(30);
    expect(result.purged.companies).toBe(1);
    expect(result.purged.leads).toBe(2);
    expect(prisma.lead.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: expect.objectContaining({ lte: expect.any(Date) }),
        }),
      }),
    );
  });
});
