import { Injectable } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import { LeadsService } from '../leads/leads.service';
import { ConversationsService } from '../conversations/conversations.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { AiCrmClient, AiMessagePayload } from './ai-crm.client';

export type AiAssistKind = 'summarize' | 'reply' | 'next_step';

export interface QualifyLeadResult {
  leadId: string;
  score: number;
  status: LeadStatus;
  suggestion: string;
}

export interface SuggestNextStepResult {
  entityType: string;
  entityId: string;
  suggestedAction: string;
  confidence: number;
  channel?: string | null;
  suggestionId?: string;
}

export interface ConversationSummarizeResult {
  conversationId: string;
  summary: string;
  topics: string[];
  sentiment: string;
  messageCount: number;
  suggestionId?: string;
}

export interface ConversationSuggestReplyResult {
  conversationId: string;
  draft: string;
  confidence: number;
  disclaimer: string;
  channel?: string | null;
  suggestionId?: string;
}

export interface AssistAsyncResult {
  status: 'queued';
  conversationId: string;
  kind: AiAssistKind;
}

@Injectable()
export class AiToolbeltService {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly conversationsService: ConversationsService,
    private readonly aiCrm: AiCrmClient,
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async qualifyLead(tenantId: string, leadId: string): Promise<QualifyLeadResult> {
    const lead = await this.leadsService.qualify(tenantId, leadId, { score: 75 });
    return {
      leadId: lead.id,
      score: lead.score,
      status: lead.status,
      suggestion: 'Schedule discovery call within 24h',
    };
  }

  async suggestNextStep(
    tenantId: string,
    entityType: string,
    entityId: string,
    conversationId?: string,
  ): Promise<SuggestNextStepResult> {
    const context: Record<string, unknown> = {
      stage: entityType === 'opportunity' ? 'proposal' : 'prospecting',
      entityType,
      entityId,
    };

    let resolvedConversationId = conversationId;
    if (conversationId) {
      const conv = await this.conversationsService.findOne(tenantId, conversationId);
      context.channel = conv.channel;
      context.conversation_status = conv.status;
      context.message_count = conv.messages?.length ?? 0;
      resolvedConversationId = conv.id;
    }

    const ai = await this.aiCrm.suggestNextStep(tenantId, context);
    const suggestionId = await this.persistAndPublish(tenantId, {
      conversationId: resolvedConversationId,
      kind: 'next_step',
      content: ai.suggested_action,
      metadata: {
        entityType,
        entityId,
        priority: ai.priority,
        channel: ai.channel ?? null,
        confidence: ai.priority === 'high' ? 0.8 : 0.6,
      },
    });

    return {
      entityType,
      entityId,
      suggestedAction: ai.suggested_action,
      confidence: ai.priority === 'high' ? 0.8 : 0.6,
      channel: ai.channel ?? null,
      suggestionId,
    };
  }

  async summarizeConversation(
    tenantId: string,
    conversationId: string,
  ): Promise<ConversationSummarizeResult> {
    const conv = await this.conversationsService.findOne(tenantId, conversationId);
    const messages = this.toAiMessages(conv.messages ?? []);
    const ai = await this.aiCrm.summarize(tenantId, messages);
    const suggestionId = await this.persistAndPublish(tenantId, {
      conversationId: conv.id,
      kind: 'summarize',
      content: ai.summary,
      metadata: {
        topics: ai.topics,
        sentiment: ai.sentiment,
        messageCount: ai.message_count,
      },
    });

    return {
      conversationId: conv.id,
      summary: ai.summary,
      topics: ai.topics,
      sentiment: ai.sentiment,
      messageCount: ai.message_count,
      suggestionId,
    };
  }

  async suggestReply(
    tenantId: string,
    conversationId: string,
  ): Promise<ConversationSuggestReplyResult> {
    const conv = await this.conversationsService.findOne(tenantId, conversationId);
    const messages = this.toAiMessages(conv.messages ?? []);
    const ai = await this.aiCrm.suggestReply(tenantId, messages, conv.channel);
    const disclaimer = ai.disclaimer ?? 'Rascunho para o agente — envio somente pelo Chatwoot.';
    const suggestionId = await this.persistAndPublish(tenantId, {
      conversationId: conv.id,
      kind: 'reply',
      content: ai.draft,
      metadata: {
        confidence: ai.confidence,
        channel: ai.channel ?? conv.channel,
        disclaimer,
      },
    });

    return {
      conversationId: conv.id,
      draft: ai.draft,
      confidence: ai.confidence,
      disclaimer,
      channel: ai.channel ?? conv.channel,
      suggestionId,
    };
  }

  async requestAssistAsync(
    tenantId: string,
    conversationId: string,
    kind: AiAssistKind,
  ): Promise<AssistAsyncResult> {
    await this.conversationsService.findOne(tenantId, conversationId);
    await this.events.publish(tenantId, 'ai.assist.requested', {
      conversationId,
      kind,
    });
    return { status: 'queued', conversationId, kind };
  }

  listSuggestions(tenantId: string, conversationId: string) {
    return this.prisma.aiSuggestion.findMany({
      where: { tenantId, conversationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  private async persistAndPublish(
    tenantId: string,
    input: {
      conversationId?: string | null;
      kind: AiAssistKind;
      content: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<string> {
    const row = await this.prisma.aiSuggestion.create({
      data: {
        tenantId,
        conversationId: input.conversationId ?? null,
        kind: input.kind,
        content: input.content,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.events.publish(tenantId, 'ai.suggestion.created', {
      suggestionId: row.id,
      conversationId: row.conversationId,
      kind: row.kind,
    });

    return row.id;
  }

  private toAiMessages(
    messages: Array<{ direction: string; body?: string | null }>,
  ): AiMessagePayload[] {
    return messages.map((m) => ({
      direction: m.direction,
      content: m.body,
      body: m.body,
    }));
  }
}
