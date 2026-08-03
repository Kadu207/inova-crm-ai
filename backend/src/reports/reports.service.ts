import { BadRequestException, Injectable } from '@nestjs/common';
import { ConversationStatus, LeadStatus, OpportunityStatus, Prisma } from '@prisma/client';
import { notDeleted } from '../common/soft-delete';
import { PrismaService } from '../prisma/prisma.service';
import { resolveReportPeriod, type ReportPeriod } from './report-period';

export type PipelineReportRow = {
  stageId: string;
  stageName: string;
  stageOrder: number;
  count: number;
  amountSum: number;
};

export type PipelineReportResponse = {
  data: PipelineReportRow[];
  meta: {
    from: string;
    to: string;
    pipelineId?: string;
  };
};

export type LeadConversionReportResponse = {
  data: {
    createdCount: number;
    convertedCount: number;
    conversionRate: number;
  };
  meta: {
    from: string;
    to: string;
    definition: 'CONVERTED_status_or_linked_opportunity';
  };
};

export type RevenueReportResponse = {
  data: {
    forecast: number;
    realized: number;
  };
  meta: {
    from: string;
    to: string;
    pipelineId?: string;
    realizedDateField: 'updatedAt';
    forecastDateRule: 'expectedCloseDate_else_createdAt';
  };
};

export type SlaReportResponse = {
  data: {
    conversationsOpen: number;
    conversationsTotal: number;
    opportunitiesSlaBreached: number;
  };
  meta: {
    from: string;
    to: string;
    partial: true;
    partialReason: 'first_response_not_modeled';
  };
};

export const REPORT_EXPORT_KINDS = [
  'pipeline',
  'lead-conversion',
  'revenue',
  'sla',
] as const;

export type ReportExportKind = (typeof REPORT_EXPORT_KINDS)[number];

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  const n = value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function periodMeta(period: ReportPeriod, pipelineId?: string) {
  return {
    from: period.from.toISOString(),
    to: period.to.toISOString(),
    ...(pipelineId ? { pipelineId } : {}),
  };
}

function csvEscape(value: string | number | boolean): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: Array<Array<string | number | boolean>>): string {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  return `${lines.join('\n')}\n`;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async pipeline(
    tenantId: string,
    query: { from?: string; to?: string; pipelineId?: string },
  ): Promise<PipelineReportResponse> {
    const period = resolveReportPeriod(query.from, query.to);
    const pipelineId = query.pipelineId?.trim() || undefined;

    const where: Prisma.OpportunityWhereInput = {
      tenantId,
      ...notDeleted,
      status: OpportunityStatus.OPEN,
      createdAt: { gte: period.from, lte: period.to },
      ...(pipelineId ? { pipelineId } : {}),
    };

    const grouped = await this.prisma.opportunity.groupBy({
      by: ['stageId'],
      where,
      _count: { _all: true },
      _sum: { value: true },
    });

    if (grouped.length === 0) {
      return {
        data: [],
        meta: periodMeta(period, pipelineId),
      };
    }

    const stageIds = grouped.map((g) => g.stageId);
    const stages = await this.prisma.pipelineStage.findMany({
      where: { tenantId, id: { in: stageIds } },
      select: { id: true, name: true, order: true },
    });
    const stageMap = new Map(stages.map((s) => [s.id, s]));

    const data: PipelineReportRow[] = grouped
      .map((g) => {
        const stage = stageMap.get(g.stageId);
        return {
          stageId: g.stageId,
          stageName: stage?.name ?? g.stageId,
          stageOrder: stage?.order ?? 0,
          count: g._count._all,
          amountSum: decimalToNumber(g._sum.value),
        };
      })
      .sort((a, b) => a.stageOrder - b.stageOrder || a.stageName.localeCompare(b.stageName));

    return {
      data,
      meta: periodMeta(period, pipelineId),
    };
  }

  async leadConversion(
    tenantId: string,
    query: { from?: string; to?: string },
  ): Promise<LeadConversionReportResponse> {
    const period = resolveReportPeriod(query.from, query.to);
    const createdInPeriod: Prisma.LeadWhereInput = {
      tenantId,
      ...notDeleted,
      createdAt: { gte: period.from, lte: period.to },
    };

    const [createdCount, convertedCount] = await Promise.all([
      this.prisma.lead.count({ where: createdInPeriod }),
      this.prisma.lead.count({
        where: {
          ...createdInPeriod,
          OR: [
            { status: LeadStatus.CONVERTED },
            { opportunities: { some: { ...notDeleted } } },
          ],
        },
      }),
    ]);

    const conversionRate = createdCount === 0 ? 0 : convertedCount / createdCount;

    return {
      data: {
        createdCount,
        convertedCount,
        conversionRate,
      },
      meta: {
        from: period.from.toISOString(),
        to: period.to.toISOString(),
        definition: 'CONVERTED_status_or_linked_opportunity',
      },
    };
  }

  async revenue(
    tenantId: string,
    query: { from?: string; to?: string; pipelineId?: string },
  ): Promise<RevenueReportResponse> {
    const period = resolveReportPeriod(query.from, query.to);
    const pipelineId = query.pipelineId?.trim() || undefined;
    const pipelineFilter = pipelineId ? { pipelineId } : {};

    const forecastDateFilter: Prisma.OpportunityWhereInput = {
      OR: [
        { expectedCloseDate: { gte: period.from, lte: period.to } },
        {
          AND: [{ expectedCloseDate: null }, { createdAt: { gte: period.from, lte: period.to } }],
        },
      ],
    };

    const [forecastAgg, realizedAgg] = await Promise.all([
      this.prisma.opportunity.aggregate({
        where: {
          tenantId,
          ...notDeleted,
          status: OpportunityStatus.OPEN,
          ...pipelineFilter,
          ...forecastDateFilter,
        },
        _sum: { value: true },
      }),
      this.prisma.opportunity.aggregate({
        where: {
          tenantId,
          ...notDeleted,
          status: OpportunityStatus.WON,
          updatedAt: { gte: period.from, lte: period.to },
          ...pipelineFilter,
        },
        _sum: { value: true },
      }),
    ]);

    return {
      data: {
        forecast: decimalToNumber(forecastAgg._sum.value),
        realized: decimalToNumber(realizedAgg._sum.value),
      },
      meta: {
        ...periodMeta(period, pipelineId),
        realizedDateField: 'updatedAt',
        forecastDateRule: 'expectedCloseDate_else_createdAt',
      },
    };
  }

  async sla(
    tenantId: string,
    query: { from?: string; to?: string },
  ): Promise<SlaReportResponse> {
    const period = resolveReportPeriod(query.from, query.to);

    const [conversationsOpen, conversationsTotal, opportunitiesSlaBreached] = await Promise.all([
      this.prisma.conversation.count({
        where: {
          tenantId,
          status: { in: [ConversationStatus.OPEN, ConversationStatus.PENDING] },
          createdAt: { gte: period.from, lte: period.to },
        },
      }),
      this.prisma.conversation.count({
        where: {
          tenantId,
          createdAt: { gte: period.from, lte: period.to },
        },
      }),
      this.prisma.opportunity.count({
        where: {
          tenantId,
          ...notDeleted,
          slaBreachedAt: { not: null, gte: period.from, lte: period.to },
        },
      }),
    ]);

    return {
      data: {
        conversationsOpen,
        conversationsTotal,
        opportunitiesSlaBreached,
      },
      meta: {
        from: period.from.toISOString(),
        to: period.to.toISOString(),
        partial: true,
        partialReason: 'first_response_not_modeled',
      },
    };
  }

  async exportCsv(
    tenantId: string,
    kind: string,
    query: { from?: string; to?: string; pipelineId?: string },
  ): Promise<string> {
    if (!REPORT_EXPORT_KINDS.includes(kind as ReportExportKind)) {
      throw new BadRequestException(
        `Invalid report kind. Allowed: ${REPORT_EXPORT_KINDS.join(', ')}`,
      );
    }

    switch (kind as ReportExportKind) {
      case 'pipeline': {
        const report = await this.pipeline(tenantId, query);
        return toCsv(
          ['stageId', 'stageName', 'stageOrder', 'count', 'amountSum', 'from', 'to'],
          report.data.map((row) => [
            row.stageId,
            row.stageName,
            row.stageOrder,
            row.count,
            row.amountSum,
            report.meta.from,
            report.meta.to,
          ]),
        );
      }
      case 'lead-conversion': {
        const report = await this.leadConversion(tenantId, query);
        return toCsv(
          ['createdCount', 'convertedCount', 'conversionRate', 'from', 'to', 'definition'],
          [
            [
              report.data.createdCount,
              report.data.convertedCount,
              report.data.conversionRate,
              report.meta.from,
              report.meta.to,
              report.meta.definition,
            ],
          ],
        );
      }
      case 'revenue': {
        const report = await this.revenue(tenantId, query);
        return toCsv(
          ['forecast', 'realized', 'from', 'to', 'realizedDateField', 'forecastDateRule'],
          [
            [
              report.data.forecast,
              report.data.realized,
              report.meta.from,
              report.meta.to,
              report.meta.realizedDateField,
              report.meta.forecastDateRule,
            ],
          ],
        );
      }
      case 'sla': {
        const report = await this.sla(tenantId, query);
        return toCsv(
          [
            'conversationsOpen',
            'conversationsTotal',
            'opportunitiesSlaBreached',
            'from',
            'to',
            'partial',
            'partialReason',
          ],
          [
            [
              report.data.conversationsOpen,
              report.data.conversationsTotal,
              report.data.opportunitiesSlaBreached,
              report.meta.from,
              report.meta.to,
              report.meta.partial,
              report.meta.partialReason,
            ],
          ],
        );
      }
      default: {
        const _exhaustive: never = kind as never;
        throw new BadRequestException(`Unhandled kind: ${_exhaustive}`);
      }
    }
  }
}
