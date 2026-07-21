import { Injectable } from '@nestjs/common';
import { ConversationStatus, LeadStatus, OpportunityStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type DashboardSummary = {
  leadsActive: number;
  opportunitiesOpen: number;
  conversationsOpen: number;
  pipelineValue: number;
};

export type ActivityKind = 'lead' | 'opportunity' | 'conversation' | 'company' | 'contact';

export type DashboardActivityItem = {
  id: string;
  kind: ActivityKind;
  label: string;
  href: string;
  occurredAt: string;
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

  async getActivity(tenantId: string, limit = 20): Promise<DashboardActivityItem[]> {
    const take = Math.min(Math.max(limit, 1), 50);
    const perSource = Math.min(take, 20);

    const [leads, opportunities, conversations, companies, contacts] = await Promise.all([
      this.prisma.lead.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: perSource,
        select: { id: true, title: true, updatedAt: true },
      }),
      this.prisma.opportunity.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: perSource,
        select: { id: true, title: true, updatedAt: true },
      }),
      this.prisma.conversation.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: perSource,
        select: { id: true, channel: true, chatwootId: true, updatedAt: true },
      }),
      this.prisma.company.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: perSource,
        select: { id: true, name: true, updatedAt: true },
      }),
      this.prisma.contact.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: perSource,
        select: { id: true, name: true, updatedAt: true },
      }),
    ]);

    const items: DashboardActivityItem[] = [
      ...leads.map((row) => ({
        id: `lead:${row.id}`,
        kind: 'lead' as const,
        label: row.title,
        href: `/leads/${row.id}`,
        occurredAt: row.updatedAt.toISOString(),
      })),
      ...opportunities.map((row) => ({
        id: `opportunity:${row.id}`,
        kind: 'opportunity' as const,
        label: row.title,
        href: '/funil',
        occurredAt: row.updatedAt.toISOString(),
      })),
      ...conversations.map((row) => ({
        id: `conversation:${row.id}`,
        kind: 'conversation' as const,
        label: [row.chatwootId != null ? `#${row.chatwootId}` : 'Conversa', row.channel]
          .filter(Boolean)
          .join(' · '),
        href: '/atendimento',
        occurredAt: row.updatedAt.toISOString(),
      })),
      ...companies.map((row) => ({
        id: `company:${row.id}`,
        kind: 'company' as const,
        label: row.name,
        href: `/empresas/${row.id}`,
        occurredAt: row.updatedAt.toISOString(),
      })),
      ...contacts.map((row) => ({
        id: `contact:${row.id}`,
        kind: 'contact' as const,
        label: row.name,
        href: `/contatos/${row.id}`,
        occurredAt: row.updatedAt.toISOString(),
      })),
    ];

    return items
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, take);
  }
}
