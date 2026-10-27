import { Injectable, NotFoundException } from '@nestjs/common';
import { Conversation, ConversationStatus } from '@prisma/client';
import { notDeleted } from '../common/soft-delete';
import { resolveChatwootIdentity } from '../common/chatwoot-channel';
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
        contact: {
          select: { id: true, name: true, phone: true, email: true, telegramUsername: true },
        },
        lead: { select: { id: true, title: true, status: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, tenantId },
      include: {
        contact: {
          select: { id: true, name: true, phone: true, email: true, telegramUsername: true },
        },
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
    const identity = resolveChatwootIdentity(dto);
    const status = mapChatwootStatus(dto.status);

    let contactId = dto.contactId;
    if (
      !contactId &&
      (dto.phone ||
        dto.email ||
        dto.name ||
        identity.whatsappExternalId ||
        identity.telegramExternalId)
    ) {
      contactId = await this.resolveContactId(tenantId, {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        whatsappExternalId: identity.whatsappExternalId,
        telegramExternalId: identity.telegramExternalId,
        telegramUsername: identity.telegramUsername,
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
        await this.prisma.conversation.updateMany({
          where: { id: existing.id, tenantId },
          data: {
            ...(status ? { status } : {}),
            ...(contactId ? { contactId } : {}),
            ...(leadId ? { leadId } : {}),
            ...(dto.channel?.trim() ? { channel: identity.channel } : {}),
            lastMessageAt: new Date(),
            ...(dto.accountId != null ? { chatwootAccountId: dto.accountId } : {}),
          },
        });
        const conv = await this.findOne(tenantId, existing.id);
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
      channel: identity.channel,
      status,
      contactId,
      leadId,
      ...(dto.accountId != null ? { chatwootAccountId: dto.accountId } : {}),
    });
    await this.prisma.conversation.updateMany({
      where: { id: conv.id, tenantId },
      data: { lastMessageAt: new Date() },
    });
    return this.findOne(tenantId, conv.id);
  }

  async update(tenantId: string, id: string, dto: UpdateConversationDto): Promise<Conversation> {
    await this.findOne(tenantId, id);
    const result = await this.prisma.conversation.updateMany({
      where: { id, tenantId },
      data: dto,
    });
    if (result.count === 0) throw new NotFoundException(`Conversation ${id} not found`);
    const conv = await this.findOne(tenantId, id);
    if (dto.status === 'RESOLVED') {
      await this.events.publish(tenantId, 'conversation.resolved', {
        conversationId: conv.id,
      });
    }
    return conv;
  }

  private async resolveContactId(
    tenantId: string,
    input: {
      name?: string;
      phone?: string;
      email?: string;
      whatsappExternalId?: string;
      telegramExternalId?: string;
      telegramUsername?: string;
    },
  ): Promise<string | undefined> {
    const telegramPatch = {
      ...(input.telegramExternalId ? { telegramExternalId: input.telegramExternalId } : {}),
      ...(input.telegramUsername ? { telegramUsername: input.telegramUsername } : {}),
    };

    if (input.telegramExternalId) {
      const byTg = await this.prisma.contact.findFirst({
        where: { tenantId, telegramExternalId: input.telegramExternalId, ...notDeleted },
      });
      if (byTg) {
        await this.prisma.contact.update({
          where: { id: byTg.id },
          data: {
            name: input.name?.trim() || byTg.name,
            phone: input.phone ?? byTg.phone,
            email: input.email ?? byTg.email,
            ...telegramPatch,
          },
        });
        return byTg.id;
      }
    }

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
            ...telegramPatch,
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
            ...telegramPatch,
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
            ...telegramPatch,
          },
        });
        return byPhone.id;
      }
    }
    if (
      !input.name &&
      !input.phone &&
      !input.email &&
      !input.whatsappExternalId &&
      !input.telegramExternalId
    ) {
      return undefined;
    }

    const created = await this.prisma.contact.create({
      data: {
        tenantId,
        name:
          input.name?.trim() ||
          input.phone ||
          input.email ||
          (input.telegramUsername ? `@${input.telegramUsername}` : undefined) ||
          input.telegramExternalId ||
          input.whatsappExternalId ||
          'Chatwoot contact',
        phone: input.phone,
        email: input.email,
        whatsappExternalId: input.whatsappExternalId,
        telegramExternalId: input.telegramExternalId,
        telegramUsername: input.telegramUsername,
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
