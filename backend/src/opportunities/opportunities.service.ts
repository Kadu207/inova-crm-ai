import { Injectable, NotFoundException } from '@nestjs/common';
import { Opportunity, OpportunityStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { CreateOpportunityDto, UpdateOpportunityDto } from './dto/opportunity.dto';

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
    const opp = await this.prisma.opportunity.create({
      data: {
        tenantId,
        title: dto.title,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        contactId: dto.contactId,
        value: dto.value !== undefined ? new Prisma.Decimal(dto.value) : undefined,
      },
    });
    await this.events.publish(tenantId, 'opportunity.created', { opportunityId: opp.id });
    return opp;
  }

  async update(tenantId: string, id: string, dto: UpdateOpportunityDto): Promise<Opportunity> {
    const existing = await this.findOne(tenantId, id);
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
        stageId: opp.stageId,
      });
    }

    if (dto.status === OpportunityStatus.WON) {
      await this.events.publish(tenantId, 'opportunity.won', { opportunityId: opp.id });
    } else if (dto.status === OpportunityStatus.LOST) {
      await this.events.publish(tenantId, 'opportunity.lost', { opportunityId: opp.id });
    }

    return opp;
  }
}
