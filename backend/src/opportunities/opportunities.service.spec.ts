import { Test, TestingModule } from '@nestjs/testing';
import { OpportunityStatus, TenantStatus } from '@prisma/client';
import { OpportunitiesService } from './opportunities.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

describe('OpportunitiesService SLA', () => {
  let service: OpportunitiesService;
  let prisma: {
    opportunity: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    pipelineStage: { findFirst: jest.Mock };
    tenant: { findMany: jest.Mock };
  };
  let events: { publish: jest.Mock };

  beforeEach(async () => {
    prisma = {
      opportunity: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      pipelineStage: { findFirst: jest.fn() },
      tenant: { findMany: jest.fn() },
    };
    events = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunitiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsService, useValue: events },
      ],
    }).compile();

    service = module.get(OpportunitiesService);
  });

  it('checkSla publishes opportunity.sla.breached for overdue open deals', async () => {
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000);
    prisma.opportunity.findMany.mockResolvedValue([
      {
        id: 'opp-1',
        tenantId: 't1',
        stageId: 's1',
        status: OpportunityStatus.OPEN,
        stageEnteredAt: old,
        slaBreachedAt: null,
      },
    ]);
    prisma.opportunity.update.mockResolvedValue({
      id: 'opp-1',
      stageId: 's1',
      stageEnteredAt: old,
      slaBreachedAt: new Date(),
    });

    const result = await service.checkSla('t1');
    expect(prisma.opportunity.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        tenantId: 't1',
        deletedAt: null,
        status: OpportunityStatus.OPEN,
        slaBreachedAt: null,
      }),
    });
    expect(result.breached).toEqual(['opp-1']);
    expect(events.publish).toHaveBeenCalledWith(
      't1',
      'opportunity.sla.breached',
      expect.objectContaining({ opportunityId: 'opp-1' }),
    );
  });

  it('checkSlaAll runs checkSla for ACTIVE and TRIAL tenants', async () => {
    prisma.tenant.findMany.mockResolvedValue([{ id: 't1' }, { id: 't2' }]);
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000);
    prisma.opportunity.findMany
      .mockResolvedValueOnce([
        {
          id: 'opp-1',
          tenantId: 't1',
          stageId: 's1',
          status: OpportunityStatus.OPEN,
          stageEnteredAt: old,
          slaBreachedAt: null,
        },
      ])
      .mockResolvedValueOnce([]);
    prisma.opportunity.update.mockResolvedValue({
      id: 'opp-1',
      stageId: 's1',
      stageEnteredAt: old,
      slaBreachedAt: new Date(),
    });

    const result = await service.checkSlaAll();
    expect(prisma.tenant.findMany).toHaveBeenCalledWith({
      where: { status: { in: [TenantStatus.ACTIVE, TenantStatus.TRIAL] } },
      select: { id: true },
    });
    expect(result.tenants).toBe(2);
    expect(result.checked).toBe(1);
    expect(result.breached).toEqual([{ tenantId: 't1', opportunityId: 'opp-1' }]);
  });

  it('moveStage resets slaBreachedAt via update', async () => {
    prisma.opportunity.findFirst.mockResolvedValue({
      id: 'opp-1',
      tenantId: 't1',
      pipelineId: 'p1',
      stageId: 's1',
      status: OpportunityStatus.OPEN,
      slaBreachedAt: new Date(),
    });
    prisma.pipelineStage.findFirst.mockResolvedValue({ id: 's2', pipelineId: 'p1' });
    prisma.opportunity.update.mockResolvedValue({
      id: 'opp-1',
      stageId: 's2',
      status: OpportunityStatus.OPEN,
      slaBreachedAt: null,
    });

    await service.moveStage('t1', 'opp-1', { stageId: 's2' });
    expect(prisma.opportunity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stageId: 's2',
          slaBreachedAt: null,
          stageEnteredAt: expect.any(Date),
        }),
      }),
    );
  });
});
