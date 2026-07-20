import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Contact, Lead, LeadSource, LeadStatus, Opportunity, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import {
  ConvertLeadDto,
  CreateLeadDto,
  InboundLeadDto,
  QualifyLeadDto,
  UpdateLeadDto,
} from './dto/lead.dto';

const OPEN_LEAD_STATUSES: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
];

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
    if (dto.contactId) {
      const dup = await this.findOpenLeadByContact(tenantId, dto.contactId);
      if (dup) {
        throw new BadRequestException(
          `Duplicate open lead for contact ${dto.contactId}: ${dup.id}`,
        );
      }
    }

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

  /**
   * Chatwoot inbound: upsert Contact by phone/email, dedupe open Lead,
   * upsert Conversation linked to lead (RN-LEAD-01/03, RN-CONV-01).
   */
  async inboundFromChatwoot(tenantId: string, dto: InboundLeadDto): Promise<Lead> {
    const who =
      dto.name?.trim() ||
      dto.phone?.trim() ||
      dto.email?.trim() ||
      dto.whatsappExternalId?.trim() ||
      'Chatwoot contact';
    const snippet = dto.message?.trim().slice(0, 80);
    const title = snippet ? `Lead Chatwoot: ${who} — ${snippet}` : `Lead Chatwoot: ${who}`;
    const noteLine = [
      dto.event ? `event=${dto.event}` : null,
      dto.accountId != null ? `accountId=${dto.accountId}` : null,
      dto.conversationId != null ? `conversationId=${dto.conversationId}` : null,
      dto.phone ? `phone=${dto.phone}` : null,
      dto.email ? `email=${dto.email}` : null,
      dto.whatsappExternalId ? `whatsappExternalId=${dto.whatsappExternalId}` : null,
      dto.message ? `message=${dto.message}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const contact = await this.findOrCreateContact(tenantId, {
      name: dto.name?.trim() || who,
      phone: dto.phone?.trim() || undefined,
      email: dto.email?.trim() || undefined,
      whatsappExternalId: dto.whatsappExternalId?.trim() || undefined,
    });

    const existing = await this.findOpenLeadByContact(tenantId, contact.id);
    let lead: Lead;

    if (existing) {
      const notes = [existing.notes, noteLine].filter(Boolean).join('\n---\n');
      lead = await this.prisma.lead.update({
        where: { id: existing.id },
        data: {
          notes: notes || existing.notes,
          title: existing.title.startsWith('Lead Chatwoot:') ? title : existing.title,
        },
      });
      await this.events.publish(tenantId, 'lead.updated', {
        leadId: lead.id,
        status: lead.status,
        deduped: true,
      });
    } else {
      lead = await this.prisma.lead.create({
        data: {
          tenantId,
          title,
          source: LeadSource.CHATWOOT,
          contactId: contact.id,
          notes: noteLine || undefined,
          status: LeadStatus.NEW,
        },
      });
      await this.events.publish(tenantId, 'lead.created', {
        leadId: lead.id,
        source: lead.source,
        status: lead.status,
      });
    }

    if (dto.conversationId != null) {
      await this.upsertConversationForLead(tenantId, {
        chatwootId: dto.conversationId,
        accountId: dto.accountId,
        contactId: contact.id,
        leadId: lead.id,
      });
    }

    return lead;
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

  async qualify(tenantId: string, id: string, dto: QualifyLeadDto = {}): Promise<Lead> {
    await this.findOne(tenantId, id);
    const score = dto.score ?? 80;
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

  /**
   * Convert qualified/open lead into Opportunity on default (or given) pipeline stage.
   * RN-LEAD convert + opportunity.created + lead.converted.
   */
  async convert(
    tenantId: string,
    id: string,
    dto: ConvertLeadDto = {},
  ): Promise<{ lead: Lead; opportunity: Opportunity }> {
    const lead = await this.findOne(tenantId, id);
    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException(`Lead ${id} already converted`);
    }
    if (lead.status === LeadStatus.LOST || lead.status === LeadStatus.UNQUALIFIED) {
      throw new BadRequestException(`Lead ${id} cannot be converted from status ${lead.status}`);
    }

    const pipeline =
      dto.pipelineId != null
        ? await this.prisma.pipeline.findFirst({
            where: { id: dto.pipelineId, tenantId },
            include: { stages: { orderBy: { order: 'asc' } } },
          })
        : await this.prisma.pipeline.findFirst({
            where: { tenantId, isDefault: true },
            include: { stages: { orderBy: { order: 'asc' } } },
          });

    if (!pipeline) {
      throw new BadRequestException('No default pipeline for tenant — create a funil first');
    }

    const stage =
      dto.stageId != null ? pipeline.stages.find((s) => s.id === dto.stageId) : pipeline.stages[0];

    if (!stage || stage.pipelineId !== pipeline.id) {
      throw new BadRequestException('Stage does not belong to the selected pipeline');
    }

    const opportunity = await this.prisma.opportunity.create({
      data: {
        tenantId,
        pipelineId: pipeline.id,
        stageId: stage.id,
        leadId: lead.id,
        contactId: lead.contactId ?? undefined,
        title: dto.title?.trim() || lead.title,
        value: dto.value !== undefined ? new Prisma.Decimal(dto.value) : undefined,
        status: 'OPEN',
      },
    });

    const converted = await this.prisma.lead.update({
      where: { id: lead.id },
      data: { status: LeadStatus.CONVERTED },
    });

    await this.events.publish(tenantId, 'lead.converted', {
      leadId: converted.id,
      opportunityId: opportunity.id,
    });
    await this.events.publish(tenantId, 'opportunity.created', {
      opportunityId: opportunity.id,
      leadId: lead.id,
    });

    return { lead: converted, opportunity };
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.lead.delete({ where: { id } });

    await this.events.publish(tenantId, 'lead.deleted', { leadId: id });
  }

  private async findOpenLeadByContact(tenantId: string, contactId: string): Promise<Lead | null> {
    return this.prisma.lead.findFirst({
      where: {
        tenantId,
        contactId,
        status: { in: OPEN_LEAD_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findOrCreateContact(
    tenantId: string,
    input: { name: string; phone?: string; email?: string; whatsappExternalId?: string },
  ): Promise<Contact> {
    if (input.whatsappExternalId) {
      const byWa = await this.prisma.contact.findFirst({
        where: { tenantId, whatsappExternalId: input.whatsappExternalId },
      });
      if (byWa) {
        return this.prisma.contact.update({
          where: { id: byWa.id },
          data: {
            name: input.name || byWa.name,
            phone: input.phone ?? byWa.phone,
            email: input.email ?? byWa.email,
          },
        });
      }
    }

    if (input.email) {
      const byEmail = await this.prisma.contact.findFirst({
        where: { tenantId, email: input.email },
      });
      if (byEmail) {
        return this.prisma.contact.update({
          where: { id: byEmail.id },
          data: {
            name: input.name || byEmail.name,
            phone: input.phone ?? byEmail.phone,
            whatsappExternalId: input.whatsappExternalId ?? byEmail.whatsappExternalId,
          },
        });
      }
    }

    if (input.phone) {
      const byPhone = await this.prisma.contact.findFirst({
        where: { tenantId, phone: input.phone },
      });
      if (byPhone) {
        return this.prisma.contact.update({
          where: { id: byPhone.id },
          data: {
            name: input.name || byPhone.name,
            email: input.email ?? byPhone.email,
            whatsappExternalId: input.whatsappExternalId ?? byPhone.whatsappExternalId,
          },
        });
      }
    }

    return this.prisma.contact.create({
      data: {
        tenantId,
        name: input.name,
        phone: input.phone,
        email: input.email,
        whatsappExternalId: input.whatsappExternalId,
      },
    });
  }

  private async upsertConversationForLead(
    tenantId: string,
    input: {
      chatwootId: number;
      accountId?: number;
      contactId: string;
      leadId: string;
    },
  ): Promise<void> {
    const existing = await this.prisma.conversation.findFirst({
      where: { tenantId, chatwootId: input.chatwootId },
    });

    if (existing) {
      await this.prisma.conversation.update({
        where: { id: existing.id },
        data: {
          contactId: input.contactId,
          leadId: input.leadId,
          lastMessageAt: new Date(),
          ...(input.accountId != null ? { chatwootAccountId: input.accountId } : {}),
        },
      });
      return;
    }

    const conv = await this.prisma.conversation.create({
      data: {
        tenantId,
        chatwootId: input.chatwootId,
        chatwootAccountId: input.accountId,
        contactId: input.contactId,
        leadId: input.leadId,
        channel: 'chatwoot',
        status: 'OPEN',
        lastMessageAt: new Date(),
      },
    });
    await this.events.publish(tenantId, 'conversation.created', {
      conversationId: conv.id,
      chatwootId: conv.chatwootId,
      leadId: input.leadId,
    });
  }
}
