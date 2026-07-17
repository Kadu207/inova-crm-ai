import { Injectable, NotFoundException } from '@nestjs/common';
import { Lead, LeadSource, LeadStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { CreateLeadDto, InboundLeadDto, UpdateLeadDto } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async findAll(tenantId: string): Promise<Lead[]> {
    return this.prisma.lead.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Lead> {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
    });
    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
    return lead;
  }

  async create(tenantId: string, dto: CreateLeadDto): Promise<Lead> {
    const lead = await this.prisma.lead.create({
      data: {
        tenantId,
        title: dto.title,
        status: dto.status,
        source: dto.source,
        contactId: dto.contactId,
        companyId: dto.companyId,
        notes: dto.notes,
      },
    });

    await this.events.publish(tenantId, 'lead.created', {
      leadId: lead.id,
      source: lead.source,
      status: lead.status,
    });

    return lead;
  }

  async inboundFromChatwoot(tenantId: string, dto: InboundLeadDto): Promise<Lead> {
    const who = dto.name?.trim() || dto.phone?.trim() || 'Chatwoot contact';
    const snippet = dto.message?.trim().slice(0, 80);
    const title = snippet ? `Lead Chatwoot: ${who} — ${snippet}` : `Lead Chatwoot: ${who}`;
    const notes = [
      dto.event ? `event=${dto.event}` : null,
      dto.accountId != null ? `accountId=${dto.accountId}` : null,
      dto.conversationId != null ? `conversationId=${dto.conversationId}` : null,
      dto.phone ? `phone=${dto.phone}` : null,
      dto.message ? `message=${dto.message}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    return this.create(tenantId, {
      title,
      source: LeadSource.CHATWOOT,
      notes: notes || undefined,
    });
  }

  async update(tenantId: string, id: string, dto: UpdateLeadDto): Promise<Lead> {
    await this.findOne(tenantId, id);
    const lead = await this.prisma.lead.update({
      where: { id },
      data: dto,
    });

    await this.events.publish(tenantId, 'lead.updated', {
      leadId: lead.id,
      status: lead.status,
    });

    return lead;
  }

  async qualify(tenantId: string, id: string, score = 80): Promise<Lead> {
    await this.findOne(tenantId, id);
    const lead = await this.prisma.lead.update({
      where: { id },
      data: { status: LeadStatus.QUALIFIED, score },
    });

    await this.events.publish(tenantId, 'lead.qualified', {
      leadId: lead.id,
      score: lead.score,
    });

    return lead;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.lead.delete({ where: { id } });

    await this.events.publish(tenantId, 'lead.deleted', { leadId: id });
  }
}
