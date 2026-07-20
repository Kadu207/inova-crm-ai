import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Opportunity, OpportunityStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import {
  CreateOpportunityDto,
  MoveOpportunityDto,
  UpdateOpportunityDto,
} from './dto/opportunity.dto';

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

    const opp = await this.prisma.opportunity.update({
      where: { id },
      data: {
        title: dto.title,
        stageId: dto.stageId,
        status: dto.status,
        value: dto.value !== undefined ? new Prisma.Decimal(dto.value) : undefined,
      },
    });

    if (dto.stageId && dto.stageId !== existing.stageId) {
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
