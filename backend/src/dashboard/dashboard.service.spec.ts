import { Test, TestingModule } from '@nestjs/testing';
import { ConversationStatus, LeadStatus, OpportunityStatus } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    lead: { count: jest.Mock; findMany: jest.Mock };
    opportunity: { count: jest.Mock; aggregate: jest.Mock; findMany: jest.Mock };
    conversation: { count: jest.Mock; findMany: jest.Mock };
    company: { findMany: jest.Mock };
    contact: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      lead: { count: jest.fn(), findMany: jest.fn() },
      opportunity: { count: jest.fn(), aggregate: jest.fn(), findMany: jest.fn() },
      conversation: { count: jest.fn(), findMany: jest.fn() },
      company: { findMany: jest.fn() },
      contact: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(DashboardService);
  });

  it('getSummary returns tenant-scoped KPI counts and pipeline value', async () => {
    prisma.lead.count.mockResolvedValue(5);
    prisma.opportunity.count.mockResolvedValue(3);
    prisma.conversation.count.mockResolvedValue(2);
    prisma.opportunity.aggregate.mockResolvedValue({ _sum: { value: 15000 } });

    const result = await service.getSummary('t1');

    expect(result).toEqual({
      leadsActive: 5,
      opportunitiesOpen: 3,
      conversationsOpen: 2,
      pipelineValue: 15000,
    });
    expect(prisma.lead.count).toHaveBeenCalledWith({
      where: {
        tenantId: 't1',
        deletedAt: null,
        status: {
          notIn: [LeadStatus.CONVERTED, LeadStatus.LOST, LeadStatus.UNQUALIFIED],
        },
      },
    });
    expect(prisma.opportunity.count).toHaveBeenCalledWith({
      where: { tenantId: 't1', deletedAt: null, status: OpportunityStatus.OPEN },
    });
    expect(prisma.conversation.count).toHaveBeenCalledWith({
      where: {
        tenantId: 't1',
        status: { in: [ConversationStatus.OPEN, ConversationStatus.PENDING] },
      },
    });
  });

  it('getActivity merges tenant-scoped rows newest first and respects limit', async () => {
    const tOlder = new Date('2026-07-01T10:00:00.000Z');
    const tNewer = new Date('2026-07-02T10:00:00.000Z');

    prisma.lead.findMany.mockResolvedValue([{ id: 'l1', title: 'Lead A', updatedAt: tOlder }]);
    prisma.opportunity.findMany.mockResolvedValue([]);
    prisma.conversation.findMany.mockResolvedValue([]);
    prisma.company.findMany.mockResolvedValue([{ id: 'c1', name: 'Acme', updatedAt: tNewer }]);
    prisma.contact.findMany.mockResolvedValue([]);

    const result = await service.getActivity('t1', 10);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      kind: 'company',
      label: 'Acme',
      href: '/empresas/c1',
    });
    expect(result[1]).toMatchObject({
      kind: 'lead',
      label: 'Lead A',
      href: '/leads/l1',
    });
    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 't1', deletedAt: null } }),
    );
  });
});
