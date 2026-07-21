import { Test, TestingModule } from '@nestjs/testing';
import { ConversationStatus, LeadStatus, OpportunityStatus } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    lead: { count: jest.Mock };
    opportunity: { count: jest.Mock; aggregate: jest.Mock };
    conversation: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      lead: { count: jest.fn() },
      opportunity: { count: jest.fn(), aggregate: jest.fn() },
      conversation: { count: jest.fn() },
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
        status: {
          notIn: [LeadStatus.CONVERTED, LeadStatus.LOST, LeadStatus.UNQUALIFIED],
        },
      },
    });
    expect(prisma.opportunity.count).toHaveBeenCalledWith({
      where: { tenantId: 't1', status: OpportunityStatus.OPEN },
    });
    expect(prisma.conversation.count).toHaveBeenCalledWith({
      where: {
        tenantId: 't1',
        status: { in: [ConversationStatus.OPEN, ConversationStatus.PENDING] },
      },
    });
  });
});
