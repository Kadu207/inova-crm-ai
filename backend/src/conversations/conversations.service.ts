import { Injectable, NotFoundException } from '@nestjs/common';
import { Conversation, ConversationStatus } from '@prisma/client';
import { notDeleted } from '../common/soft-delete';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import {
  CreateConversationDto,
  SyncConversationDto,
  UpdateConversationDto,
} from './dto/conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  findAll(tenantId: string) {
    return this.prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        contact: { select: { id: true, name: true, phone: true, email: true } },
        lead: { select: { id: true, title: true, status: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
      include: {
        contact: { select: { id: true, name: true, phone: true, email: true } },
        lead: { select: { id: true, title: true, status: true } },
      },
    });
    if (!conv) throw new NotFoundException(`Conversation ${id} not found`);
    return conv;
  }

  async create(tenantId: string, dto: CreateConversationDto): Promise<Conversation> {
    const conv = await this.prisma.conversation.create({
      data: { tenantId, ...dto },
    });
    await this.events.publish(tenantId, 'conversation.created', {
      conversationId: conv.id,
      chatwootId: conv.chatwootId,
    });
    return conv;
  }

  /**
   * Upsert conversation from Chatwoot; link contact/lead when identifiers present (RN-CONV-01/02).
   */
  async syncFromChatwoot(tenantId: string, dto: SyncConversationDto): Promise<Conversation> {
    const chatwootId = dto.conversationId;
    const status = mapChatwootStatus(dto.status);

    let contactId = dto.contactId;
    if (!contactId && (dto.phone || dto.email || dto.name || dto.whatsappExternalId)) {
      contactId = await this.resolveContactId(tenantId, {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        whatsappExternalId: dto.whatsappExternalId,
      });
    }

    let leadId = dto.leadId;
    if (!leadId && contactId) {
      const openLead = await this.prisma.lead.findFirst({
        where: {
          tenantId,
          contactId,
          ...notDeleted,
          status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] },
        },
        orderBy: { createdAt: 'desc' },
      });
      leadId = openLead?.id;
    }

    if (chatwootId != null) {
      const existing = await this.prisma.conversation.findFirst({
        where: { tenantId, chatwootId },
      });
      if (existing) {
        const conv = await this.prisma.conversation.update({
          where: { id: existing.id },
          data: {
            ...(status ? { status } : {}),
            ...(contactId ? { contactId } : {}),
            ...(leadId ? { leadId } : {}),
            lastMessageAt: new Date(),
            ...(dto.accountId != null ? { chatwootAccountId: dto.accountId } : {}),
          },
        });
        if (status === ConversationStatus.RESOLVED) {
          await this.events.publish(tenantId, 'conversation.resolved', {
            conversationId: conv.id,
          });
        }
        return conv;
      }
    }

    const conv = await this.create(tenantId, {
      chatwootId: chatwootId ?? undefined,
      channel: 'chatwoot',
      status,
      contactId,
      leadId,
      ...(dto.accountId != null ? { chatwootAccountId: dto.accountId } : {}),
    });
    return this.prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date() },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateConversationDto): Promise<Conversation> {
    await this.findOne(tenantId, id);
    const conv = await this.prisma.conversation.update({ where: { id }, data: dto });
    if (dto.status === 'RESOLVED') {
      await this.events.publish(tenantId, 'conversation.resolved', {
        conversationId: conv.id,
      });
    }
    return conv;
  }

  private async resolveContactId(
    tenantId: string,
    input: { name?: string; phone?: string; email?: string; whatsappExternalId?: string },
  ): Promise<string | undefined> {
    if (input.whatsappExternalId) {
      const byWa = await this.prisma.contact.findFirst({
        where: { tenantId, whatsappExternalId: input.whatsappExternalId, ...notDeleted },
      });
      if (byWa) {
        await this.prisma.contact.update({
          where: { id: byWa.id },
          data: {
            name: input.name?.trim() || byWa.name,
            phone: input.phone ?? byWa.phone,
            email: input.email ?? byWa.email,
          },
        });
        return byWa.id;
      }
    }
    if (input.email) {
      const byEmail = await this.prisma.contact.findFirst({
        where: { tenantId, email: input.email, ...notDeleted },
      });
      if (byEmail) {
        await this.prisma.contact.update({
          where: { id: byEmail.id },
          data: {
            whatsappExternalId: input.whatsappExternalId ?? byEmail.whatsappExternalId,
            phone: input.phone ?? byEmail.phone,
            name: input.name?.trim() || byEmail.name,
          },
        });
        return byEmail.id;
      }
    }
    if (input.phone) {
      const byPhone = await this.prisma.contact.findFirst({
        where: { tenantId, phone: input.phone, ...notDeleted },
      });
      if (byPhone) {
        await this.prisma.contact.update({
          where: { id: byPhone.id },
          data: {
            whatsappExternalId: input.whatsappExternalId ?? byPhone.whatsappExternalId,
            email: input.email ?? byPhone.email,
            name: input.name?.trim() || byPhone.name,
          },
        });
        return byPhone.id;
      }
    }
    if (!input.name && !input.phone && !input.email && !input.whatsappExternalId) {
      return undefined;
    }

    const created = await this.prisma.contact.create({
      data: {
        tenantId,
        name:
          input.name?.trim() ||
          input.phone ||
          input.email ||
          input.whatsappExternalId ||
          'Chatwoot contact',
        phone: input.phone,
        email: input.email,
        whatsappExternalId: input.whatsappExternalId,
      },
    });
    return created.id;
  }
}

function mapChatwootStatus(status?: string): ConversationStatus | undefined {
  if (!status) return undefined;
  switch (status.toLowerCase()) {
    case 'open':
      return ConversationStatus.OPEN;
    case 'resolved':
      return ConversationStatus.RESOLVED;
    case 'pending':
      return ConversationStatus.PENDING;
    case 'snoozed':
      return ConversationStatus.SNOOZED;
    default:
      return undefined;
  }
}
