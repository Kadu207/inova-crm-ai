import { BadRequestException } from '@nestjs/common';
import { ConversationStatus, LeadStatus, OpportunityStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: {
    opportunity: { groupBy: jest.Mock; aggregate: jest.Mock; count: jest.Mock };
    pipelineStage: { findMany: jest.Mock };
    lead: { count: jest.Mock };
    conversation: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      opportunity: { groupBy: jest.fn(), aggregate: jest.fn(), count: jest.fn() },
      pipelineStage: { findMany: jest.fn() },
      lead: { count: jest.fn() },
      conversation: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ReportsService);
  });

  describe('pipeline', () => {
    it('returns empty data for tenant with no opportunities', async () => {
      prisma.opportunity.groupBy.mockResolvedValue([]);

      const result = await service.pipeline('tenant-b', {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T23:59:59.000Z',
      });

      expect(result.data).toEqual([]);
      expect(result.meta.from).toBe('2026-07-01T00:00:00.000Z');
      expect(result.meta.to).toBe('2026-07-31T23:59:59.000Z');
      expect(prisma.opportunity.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['stageId'],
          where: expect.objectContaining({
            tenantId: 'tenant-b',
            deletedAt: null,
            status: OpportunityStatus.OPEN,
          }),
        }),
      );
      expect(prisma.pipelineStage.findMany).not.toHaveBeenCalled();
    });

    it('aggregates counts and amounts by stage for tenant A', async () => {
      prisma.opportunity.groupBy.mockResolvedValue([
        { stageId: 's2', _count: { _all: 1 }, _sum: { value: 1000 } },
        { stageId: 's1', _count: { _all: 2 }, _sum: { value: 5000 } },
      ]);
      prisma.pipelineStage.findMany.mockResolvedValue([
        { id: 's1', name: 'Qualificação', order: 1 },
        { id: 's2', name: 'Proposta', order: 2 },
      ]);

      const result = await service.pipeline('tenant-a', {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z',
        pipelineId: 'pipe-1',
      });

      expect(result.meta.pipelineId).toBe('pipe-1');
      expect(result.data).toEqual([
        {
          stageId: 's1',
          stageName: 'Qualificação',
          stageOrder: 1,
          count: 2,
          amountSum: 5000,
        },
        {
          stageId: 's2',
          stageName: 'Proposta',
          stageOrder: 2,
          count: 1,
          amountSum: 1000,
        },
      ]);
      expect(prisma.opportunity.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-a',
            pipelineId: 'pipe-1',
            deletedAt: null,
          }),
        }),
      );
      expect(prisma.pipelineStage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-a' }),
        }),
      );
    });

    it('rejects invalid period (from > to)', async () => {
      await expect(
        service.pipeline('tenant-a', {
          from: '2026-08-01T00:00:00.000Z',
          to: '2026-07-01T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.opportunity.groupBy).not.toHaveBeenCalled();
    });

    it('never queries without tenantId (isolation contract)', async () => {
      prisma.opportunity.groupBy.mockResolvedValue([]);
      await service.pipeline('tenant-isolated', {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-02T00:00:00.000Z',
      });
      const arg = prisma.opportunity.groupBy.mock.calls[0][0] as {
        where: { tenantId: string };
      };
      expect(arg.where.tenantId).toBe('tenant-isolated');
    });
  });

  describe('leadConversion', () => {
    it('computes rate from created vs converted (CONVERTED or opportunity)', async () => {
      prisma.lead.count.mockResolvedValueOnce(10).mockResolvedValueOnce(4);

      const result = await service.leadConversion('tenant-a', {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z',
      });

      expect(result.data).toEqual({
        createdCount: 10,
        convertedCount: 4,
        conversionRate: 0.4,
      });
      expect(result.meta.definition).toBe('CONVERTED_status_or_linked_opportunity');
      expect(prisma.lead.count).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-a',
            deletedAt: null,
          }),
        }),
      );
      expect(prisma.lead.count).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-a',
            OR: [
              { status: LeadStatus.CONVERTED },
              { opportunities: { some: { deletedAt: null } } },
            ],
          }),
        }),
      );
    });

    it('returns rate 0 when no leads created in period', async () => {
      prisma.lead.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      const result = await service.leadConversion('tenant-b', {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z',
      });
      expect(result.data.conversionRate).toBe(0);
      expect(result.data.createdCount).toBe(0);
    });

    it('scopes both counts by tenantId', async () => {
      prisma.lead.count.mockResolvedValue(0);
      await service.leadConversion('tenant-x', {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-02T00:00:00.000Z',
      });
      for (const call of prisma.lead.count.mock.calls) {
        expect(call[0].where.tenantId).toBe('tenant-x');
      }
    });
  });

  describe('revenue', () => {
    it('returns forecast OPEN and realized WON sums', async () => {
      prisma.opportunity.aggregate
        .mockResolvedValueOnce({ _sum: { value: 12000 } })
        .mockResolvedValueOnce({ _sum: { value: 3000 } });

      const result = await service.revenue('tenant-a', {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z',
        pipelineId: 'pipe-1',
      });

      expect(result.data).toEqual({ forecast: 12000, realized: 3000 });
      expect(result.meta.pipelineId).toBe('pipe-1');
      expect(result.meta.realizedDateField).toBe('updatedAt');
      expect(result.meta.forecastDateRule).toBe('expectedCloseDate_else_createdAt');

      expect(prisma.opportunity.aggregate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-a',
            status: OpportunityStatus.OPEN,
            pipelineId: 'pipe-1',
            deletedAt: null,
          }),
        }),
      );
      expect(prisma.opportunity.aggregate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-a',
            status: OpportunityStatus.WON,
            pipelineId: 'pipe-1',
            deletedAt: null,
          }),
        }),
      );
    });

    it('returns zeros when aggregates are null', async () => {
      prisma.opportunity.aggregate
        .mockResolvedValueOnce({ _sum: { value: null } })
        .mockResolvedValueOnce({ _sum: { value: null } });
      const result = await service.revenue('tenant-b', {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z',
      });
      expect(result.data).toEqual({ forecast: 0, realized: 0 });
    });

    it('rejects invalid period before querying', async () => {
      await expect(
        service.revenue('tenant-a', {
          from: '2026-08-01T00:00:00.000Z',
          to: '2026-07-01T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.opportunity.aggregate).not.toHaveBeenCalled();
    });
  });

  describe('sla', () => {
    it('returns counts with meta.partial=true', async () => {
      prisma.conversation.count.mockResolvedValueOnce(3).mockResolvedValueOnce(10);
      prisma.opportunity.count.mockResolvedValueOnce(2);

      const result = await service.sla('tenant-a', {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z',
      });

      expect(result.data).toEqual({
        conversationsOpen: 3,
        conversationsTotal: 10,
        opportunitiesSlaBreached: 2,
      });
      expect(result.meta.partial).toBe(true);
      expect(result.meta.partialReason).toBe('first_response_not_modeled');
      expect(prisma.conversation.count).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-a',
            status: { in: [ConversationStatus.OPEN, ConversationStatus.PENDING] },
          }),
        }),
      );
      expect(prisma.opportunity.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-a',
            deletedAt: null,
          }),
        }),
      );
    });

    it('returns zeros when empty (still partial)', async () => {
      prisma.conversation.count.mockResolvedValue(0);
      prisma.opportunity.count.mockResolvedValue(0);
      const result = await service.sla('tenant-b', {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z',
      });
      expect(result.data.conversationsOpen).toBe(0);
      expect(result.meta.partial).toBe(true);
    });
  });

  describe('exportCsv', () => {
    it('exports lead-conversion CSV with matching headers', async () => {
      prisma.lead.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
      const csv = await service.exportCsv('tenant-a', 'lead-conversion', {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z',
      });
      expect(csv.split('\n')[0]).toBe(
        'createdCount,convertedCount,conversionRate,from,to,definition',
      );
      expect(csv).toContain('5,2,0.4,');
    });

    it('rejects unknown kind', async () => {
      await expect(service.exportCsv('tenant-a', 'unknown', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
