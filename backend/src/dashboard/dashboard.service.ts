import { Injectable } from '@nestjs/common';
import { ConversationStatus, LeadStatus, OpportunityStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type DashboardSummary = {
  leadsActive: number;
  opportunitiesOpen: number;
  conversationsOpen: number;
  pipelineValue: number;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string): Promise<DashboardSummary> {
    const [leadsActive, opportunitiesOpen, conversationsOpen, pipelineAgg] = await Promise.all([
      this.prisma.lead.count({
        where: {
          tenantId,
          status: {
            notIn: [LeadStatus.CONVERTED, LeadStatus.LOST, LeadStatus.UNQUALIFIED],
          },
        },
      }),
      this.prisma.opportunity.count({
        where: { tenantId, status: OpportunityStatus.OPEN },
      }),
      this.prisma.conversation.count({
        where: {
          tenantId,
          status: { in: [ConversationStatus.OPEN, ConversationStatus.PENDING] },
        },
      }),
      this.prisma.opportunity.aggregate({
        where: { tenantId, status: OpportunityStatus.OPEN },
        _sum: { value: true },
      }),
    ]);

    const sum = pipelineAgg._sum.value;
    const pipelineValue =
      sum == null ? 0 : sum instanceof Prisma.Decimal ? sum.toNumber() : Number(sum);

    return {
      leadsActive,
      opportunitiesOpen,
      conversationsOpen,
      pipelineValue: Number.isFinite(pipelineValue) ? pipelineValue : 0,
    };
  }
}
