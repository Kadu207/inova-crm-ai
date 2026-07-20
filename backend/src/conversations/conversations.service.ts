import { Injectable, NotFoundException } from '@nestjs/common';
import { Conversation, ConversationStatus } from '@prisma/client';
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

  findAll(tenantId: string): Promise<Conversation[]> {
    return this.prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Conversation> {
    const conv = await this.prisma.conversation.findFirst({ where: { id, tenantId } });
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
    if (!contactId && (dto.phone || dto.email || dto.name)) {
      contactId = await this.resolveContactId(tenantId, {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
      });
    }

    let leadId = dto.leadId;
    if (!leadId && contactId) {
      const openLead = await this.prisma.lead.findFirst({
        where: {
          tenantId,
          contactId,
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
    input: { name?: string; phone?: string; email?: string },
  ): Promise<string | undefined> {
    if (input.email) {
      const byEmail = await this.prisma.contact.findFirst({
        where: { tenantId, email: input.email },
      });
      if (byEmail) return byEmail.id;
    }
    if (input.phone) {
      const byPhone = await this.prisma.contact.findFirst({
        where: { tenantId, phone: input.phone },
      });
      if (byPhone) return byPhone.id;
    }
    if (!input.name && !input.phone && !input.email) return undefined;

    const created = await this.prisma.contact.create({
      data: {
        tenantId,
        name: input.name?.trim() || input.phone || input.email || 'Chatwoot contact',
        phone: input.phone,
        email: input.email,
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
