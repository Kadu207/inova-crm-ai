import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Opportunity, OpportunityStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
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
  ) {}

  findAll(tenantId: string): Promise<Opportunity[]> {
    return this.prisma.opportunity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Opportunity> {
    const opp = await this.prisma.opportunity.findFirst({ where: { id, tenantId } });
    if (!opp) throw new NotFoundException(`Opportunity ${id} not found`);
    return opp;
  }

  async create(tenantId: string, dto: CreateOpportunityDto): Promise<Opportunity> {
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
      },
    });
    await this.events.publish(tenantId, 'opportunity.created', { opportunityId: opp.id });
    return opp;
  }

  async update(tenantId: string, id: string, dto: UpdateOpportunityDto): Promise<Opportunity> {
    const existing = await this.findOne(tenantId, id);

    if (dto.stageId && dto.stageId !== existing.stageId) {
      await this.assertStageInPipeline(tenantId, existing.pipelineId, dto.stageId);
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
  async moveStage(tenantId: string, id: string, dto: MoveOpportunityDto): Promise<Opportunity> {
    return this.update(tenantId, id, { stageId: dto.stageId });
  }

  async markWon(tenantId: string, id: string): Promise<Opportunity> {
    return this.update(tenantId, id, { status: OpportunityStatus.WON });
  }

  async markLost(tenantId: string, id: string): Promise<Opportunity> {
    return this.update(tenantId, id, { status: OpportunityStatus.LOST });
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
