import { NotFoundException } from '@nestjs/common';
import { AiToolbeltService } from './ai-toolbelt.service';
import { AiCrmClient } from './ai-crm.client';

describe('AiToolbeltService (Spec 034)', () => {
  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';
  const conversationId = 'conv-1';

  const leadsService = {
    qualify: jest.fn(),
  };

  const conversationsService = {
    findOne: jest.fn(),
  };

  const prisma = {
    aiSuggestion: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const events = {
    publish: jest.fn(),
  };

  const aiCrm: jest.Mocked<Pick<AiCrmClient, 'summarize' | 'suggestReply' | 'suggestNextStep'>> = {
    summarize: jest.fn(),
    suggestReply: jest.fn(),
    suggestNextStep: jest.fn(),
  };

  let service: AiToolbeltService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.aiSuggestion.create.mockResolvedValue({
      id: 'sug-1',
      conversationId,
      kind: 'summarize',
    });
    events.publish.mockResolvedValue(undefined);
    service = new AiToolbeltService(
      leadsService as never,
      conversationsService as never,
      aiCrm as never,
      prisma as never,
      events as never,
    );
  });

  it('summarizeConversation persists suggestion and publishes ai.suggestion.created', async () => {
    conversationsService.findOne.mockResolvedValue({
      id: conversationId,
      channel: 'telegram',
      status: 'OPEN',
      messages: [
        { direction: 'inbound', body: '/start' },
        { direction: 'inbound', body: 'Quero proposta' },
      ],
    });
    aiCrm.summarize.mockResolvedValue({
      tenant_id: tenantA,
      message_count: 2,
      topics: ['proposta'],
      summary: 'Resumo Inova TI',
      sentiment: 'neutral',
    });

    const result = await service.summarizeConversation(tenantA, conversationId);

    expect(conversationsService.findOne).toHaveBeenCalledWith(tenantA, conversationId);
    expect(prisma.aiSuggestion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: tenantA,
          conversationId,
          kind: 'summarize',
          content: 'Resumo Inova TI',
        }),
      }),
    );
    expect(events.publish).toHaveBeenCalledWith(
      tenantA,
      'ai.suggestion.created',
      expect.objectContaining({ suggestionId: 'sug-1', kind: 'summarize' }),
    );
    expect(result.suggestionId).toBe('sug-1');
    expect(result.summary).toBe('Resumo Inova TI');
  });

  it('summarizeConversation propagates NotFound for cross-tenant conversation', async () => {
    conversationsService.findOne.mockRejectedValue(
      new NotFoundException(`Conversation ${conversationId} not found`),
    );

    await expect(service.summarizeConversation(tenantB, conversationId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(aiCrm.summarize).not.toHaveBeenCalled();
    expect(prisma.aiSuggestion.create).not.toHaveBeenCalled();
  });

  it('suggestReply returns draft and persists without channel send', async () => {
    conversationsService.findOne.mockResolvedValue({
      id: conversationId,
      channel: 'whatsapp',
      status: 'OPEN',
      messages: [{ direction: 'inbound', body: 'Bom dia' }],
    });
    aiCrm.suggestReply.mockResolvedValue({
      tenant_id: tenantA,
      draft: 'Olá! Aqui é a equipe Inova TI.',
      confidence: 0.7,
      channel: 'whatsapp',
      disclaimer: 'Rascunho para o agente — envio somente pelo Chatwoot.',
    });
    prisma.aiSuggestion.create.mockResolvedValue({
      id: 'sug-reply',
      conversationId,
      kind: 'reply',
    });

    const result = await service.suggestReply(tenantA, conversationId);

    expect(result.draft).toContain('Inova TI');
    expect(result.suggestionId).toBe('sug-reply');
    expect(events.publish).toHaveBeenCalledWith(
      tenantA,
      'ai.suggestion.created',
      expect.objectContaining({ kind: 'reply' }),
    );
  });

  it('requestAssistAsync publishes ai.assist.requested', async () => {
    conversationsService.findOne.mockResolvedValue({
      id: conversationId,
      channel: 'telegram',
      status: 'OPEN',
      messages: [],
    });

    const result = await service.requestAssistAsync(tenantA, conversationId, 'summarize');

    expect(events.publish).toHaveBeenCalledWith(tenantA, 'ai.assist.requested', {
      conversationId,
      kind: 'summarize',
    });
    expect(result).toEqual({ status: 'queued', conversationId, kind: 'summarize' });
  });

  it('suggestNextStep includes conversation context when conversationId provided', async () => {
    conversationsService.findOne.mockResolvedValue({
      id: conversationId,
      channel: 'telegram',
      status: 'OPEN',
      messages: [{ direction: 'inbound', body: 'oi' }],
    });
    aiCrm.suggestNextStep.mockResolvedValue({
      tenant_id: tenantA,
      stage: 'prospecting',
      suggested_action: 'Responder no Chatwoot',
      priority: 'medium',
      channel: 'telegram',
    });
    prisma.aiSuggestion.create.mockResolvedValue({
      id: 'sug-next',
      conversationId,
      kind: 'next_step',
    });

    const result = await service.suggestNextStep(
      tenantA,
      'conversation',
      conversationId,
      conversationId,
    );

    expect(aiCrm.suggestNextStep).toHaveBeenCalledWith(
      tenantA,
      expect.objectContaining({
        channel: 'telegram',
        conversation_status: 'OPEN',
        message_count: 1,
      }),
    );
    expect(result.suggestedAction).toContain('Chatwoot');
    expect(result.suggestionId).toBe('sug-next');
  });
});
