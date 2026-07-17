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

  async syncFromChatwoot(tenantId: string, dto: SyncConversationDto): Promise<Conversation> {
    const chatwootId = dto.conversationId;
    const status = mapChatwootStatus(dto.status);

    if (chatwootId != null) {
      const existing = await this.prisma.conversation.findFirst({
        where: { tenantId, chatwootId },
      });
      if (existing) {
        return this.update(tenantId, existing.id, { status });
      }
    }

    return this.create(tenantId, {
      chatwootId: chatwootId ?? undefined,
      channel: 'chatwoot',
      status,
      ...(dto.accountId != null ? { chatwootAccountId: dto.accountId } : {}),
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
