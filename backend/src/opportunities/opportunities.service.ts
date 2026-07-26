import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Opportunity, OpportunityStatus, Prisma, TenantStatus } from '@prisma/client';
import { actorCreateFields, actorUpdateFields, detailOwnerInclude } from '../common/audit-fields';
import { listResult, ListQueryInput, ListResult, parseListQuery } from '../common/list-query';
import { notDeleted } from '../common/soft-delete';
import { compileFilterToPrisma, parseSearchBody } from '../common/filter-engine/filter-engine';
import { AdvancedSearchDto } from '../common/dto/advanced-search.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { BlueprintService } from '../blueprint/blueprint.service';
import {
  CreateOpportunityDto,
  MoveOpportunityDto,
  UpdateOpportunityDto,
} from './dto/opportunity.dto';

/** MVP default: 24h without stage advance = SLA breach (RN-OPP-03). */
export const OPPORTUNITY_STAGE_SLA_HOURS = Number(process.env.OPPORTUNITY_STAGE_SLA_HOURS ?? '24');

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly blueprint: BlueprintService,
  ) {}

  async findAll(tenantId: string, query: ListQueryInput = {}): Promise<ListResult<Opportunity>> {
    const q = parseListQuery(query);
    const where: Prisma.OpportunityWhereInput = {
      tenantId,
      ...notDeleted,
      ...(q.status ? { status: q.status as OpportunityStatus } : {}),
      ...(q.assignedToId ? { assignedToId: q.assignedToId } : {}),
      ...(q.q ? { title: { contains: q.q, mode: 'insensitive' } } : {}),
      ...(q.createdFrom || q.createdTo
        ? {
            createdAt: {
              ...(q.createdFrom ? { gte: q.createdFrom } : {}),
              ...(q.createdTo ? { lte: q.createdTo } : {}),
            },
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        orderBy: { [q.sortField]: q.sortDir },
        skip: q.skip,
        take: q.pageSize,
      }),
      this.prisma.opportunity.count({ where }),
    ]);
    return listResult(data, total, q.page, q.pageSize);
  }

  async search(tenantId: string, body: AdvancedSearchDto): Promise<ListResult<Opportunity>> {
    const q = parseSearchBody(body);
    const where = compileFilterToPrisma(
      'opportunity',
      tenantId,
      q.filter,
    ) as Prisma.OpportunityWhereInput;
    const [data, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        orderBy: { [q.sortField]: q.sortDir },
        skip: q.skip,
        take: q.pageSize,
      }),
      this.prisma.opportunity.count({ where }),
    ]);
    return listResult(data, total, q.page, q.pageSize);
  }

  async findOne(tenantId: string, id: string) {
    const opp = await this.prisma.opportunity.findFirst({
      where: { id, tenantId, ...notDeleted },
      include: detailOwnerInclude,
    });
    if (!opp) throw new NotFoundException(`Opportunity ${id} not found`);
    return opp;
  }

  async create(
    tenantId: string,
    dto: CreateOpportunityDto,
    actorUserId?: string,
  ): Promise<Opportunity> {
    await this.assertStageInPipeline(tenantId, dto.pipelineId, dto.stageId);

    const opp = await this.prisma.opportunity.create({
      data: {
        tenantId,
        title: dto.title,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        leadId: dto.leadId,
        contactId: dto.contactId,
        value: dto.value !== undefined ? new Prisma.Decimal(dto.value) : undefined,
        stageEnteredAt: new Date(),
        ...actorCreateFields(actorUserId),
      },
    });
    await this.events.publish(tenantId, 'opportunity.created', { opportunityId: opp.id });
    return opp;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateOpportunityDto,
    actorUserId?: string,
  ): Promise<Opportunity> {
    const existing = await this.findOne(tenantId, id);

    if (dto.stageId && dto.stageId !== existing.stageId) {
      await this.assertStageInPipeline(tenantId, existing.pipelineId, dto.stageId);
      await this.blueprint.assertStageTransitionAllowed(
        tenantId,
        existing.pipelineId,
        existing.stageId,
        dto.stageId,
        existing,
      );
    }

    const stageChanged = Boolean(dto.stageId && dto.stageId !== existing.stageId);

    const opp = await this.prisma.opportunity.update({
      where: { id },
      data: {
        title: dto.title,
        stageId: dto.stageId,
        status: dto.status,
        value: dto.value !== undefined ? new Prisma.Decimal(dto.value) : undefined,
        ...(stageChanged ? { stageEnteredAt: new Date(), slaBreachedAt: null } : {}),
        ...actorUpdateFields(actorUserId),
      },
    });

    if (stageChanged) {
      await this.events.publish(tenantId, 'opportunity.stage.changed', {
        opportunityId: opp.id,
        fromStageId: existing.stageId,
        stageId: opp.stageId,
      });
    }

    if (dto.status === OpportunityStatus.WON && existing.status !== OpportunityStatus.WON) {
      await this.events.publish(tenantId, 'opportunity.won', { opportunityId: opp.id });
    } else if (
      dto.status === OpportunityStatus.LOST &&
      existing.status !== OpportunityStatus.LOST
    ) {
      await this.events.publish(tenantId, 'opportunity.lost', { opportunityId: opp.id });
    }

    return opp;
  }

  /** Move deal to another stage in the same pipeline (RN-OPP-01). */
  async moveStage(
    tenantId: string,
    id: string,
    dto: MoveOpportunityDto,
    actorUserId?: string,
  ): Promise<Opportunity> {
    return this.update(tenantId, id, { stageId: dto.stageId }, actorUserId);
  }

  async markWon(tenantId: string, id: string, actorUserId?: string): Promise<Opportunity> {
    return this.update(tenantId, id, { status: OpportunityStatus.WON }, actorUserId);
  }

  async markLost(tenantId: string, id: string, actorUserId?: string): Promise<Opportunity> {
    return this.update(tenantId, id, { status: OpportunityStatus.LOST }, actorUserId);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.opportunity.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.events.publish(tenantId, 'opportunity.deleted', { opportunityId: id });
  }

  async listTasks(tenantId: string, opportunityId: string) {
    await this.findOne(tenantId, opportunityId);
    return this.prisma.task.findMany({
      where: { tenantId, opportunityId, ...notDeleted },
      orderBy: { dueDate: 'asc' },
    });
  }

  async listProposals(tenantId: string, opportunityId: string) {
    await this.findOne(tenantId, opportunityId);
    return this.prisma.proposal.findMany({
      where: { tenantId, opportunityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Scan open opportunities past stage SLA; publish opportunity.sla.breached once per stage stay.
   */
  async checkSla(tenantId: string): Promise<{ checked: number; breached: string[] }> {
    const hours = Number.isFinite(OPPORTUNITY_STAGE_SLA_HOURS) ? OPPORTUNITY_STAGE_SLA_HOURS : 24;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const overdue = await this.prisma.opportunity.findMany({
      where: {
        tenantId,
        ...notDeleted,
        status: OpportunityStatus.OPEN,
        slaBreachedAt: null,
        stageEnteredAt: { lte: cutoff },
      },
    });

    const breached: string[] = [];
    for (const opp of overdue) {
      const updated = await this.prisma.opportunity.update({
        where: { id: opp.id },
        data: { slaBreachedAt: new Date() },
      });
      await this.events.publish(tenantId, 'opportunity.sla.breached', {
        opportunityId: updated.id,
        stageId: updated.stageId,
        stageEnteredAt: updated.stageEnteredAt.toISOString(),
        slaHours: hours,
      });
      breached.push(updated.id);
    }

    return { checked: overdue.length, breached };
  }

  /**
   * Platform job: run SLA check for all ACTIVE + TRIAL tenants (n8n cron one-shot).
   */
  async checkSlaAll(): Promise<{
    tenants: number;
    checked: number;
    breached: Array<{ tenantId: string; opportunityId: string }>;
  }> {
    const tenants = await this.prisma.tenant.findMany({
      where: { status: { in: [TenantStatus.ACTIVE, TenantStatus.TRIAL] } },
      select: { id: true },
    });

    let checked = 0;
    const breached: Array<{ tenantId: string; opportunityId: string }> = [];

    for (const tenant of tenants) {
      const result = await this.checkSla(tenant.id);
      checked += result.checked;
      for (const opportunityId of result.breached) {
        breached.push({ tenantId: tenant.id, opportunityId });
      }
    }

    return { tenants: tenants.length, checked, breached };
  }

  isSlaBreached(opp: Pick<Opportunity, 'status' | 'stageEnteredAt' | 'slaBreachedAt'>): boolean {
    if (opp.status !== OpportunityStatus.OPEN) return false;
    if (opp.slaBreachedAt) return true;
    const hours = Number.isFinite(OPPORTUNITY_STAGE_SLA_HOURS) ? OPPORTUNITY_STAGE_SLA_HOURS : 24;
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return opp.stageEnteredAt.getTime() <= cutoff;
  }

  private async assertStageInPipeline(
    tenantId: string,
    pipelineId: string,
    stageId: string,
  ): Promise<void> {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, tenantId, pipelineId },
    });
    if (!stage) {
      throw new BadRequestException(
        `Stage ${stageId} is not part of pipeline ${pipelineId} for this tenant`,
      );
    }
  }
}
