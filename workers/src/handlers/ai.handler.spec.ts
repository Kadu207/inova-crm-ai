import { handleAiEvent } from './ai.handler';
import { DomainEventEnvelope } from '../types';

describe('handleAiEvent (Spec 034)', () => {
  const baseEvent: DomainEventEnvelope = {
    eventType: 'ai.assist.requested',
    tenantId: 'tenant-1',
    correlationId: 'corr-1',
    idempotencyKey: 'key-1',
    timestamp: new Date().toISOString(),
    payload: { conversationId: 'conv-1', kind: 'summarize' },
  };

  it('rejects events without tenantId', async () => {
    await expect(
      handleAiEvent({ ...baseEvent, tenantId: '' }, { log: () => undefined }),
    ).rejects.toThrow('Event missing tenantId');
  });

  it('calls summarize API for ai.assist.requested summarize', async () => {
    const apiPost = jest.fn().mockResolvedValue({ ok: true });
    const logs: string[] = [];
    await handleAiEvent(baseEvent, {
      log: (msg) => logs.push(msg),
      apiPost,
    });
    expect(apiPost).toHaveBeenCalledWith('/ai/conversations/conv-1/summarize', 'tenant-1', {});
    expect(logs).toContain('AI assist completed via API');
  });

  it('calls suggest-reply API for reply kind', async () => {
    const apiPost = jest.fn().mockResolvedValue({ ok: true });
    await handleAiEvent(
      {
        ...baseEvent,
        idempotencyKey: 'key-reply',
        payload: { conversationId: 'conv-2', kind: 'reply' },
      },
      { log: () => undefined, apiPost },
    );
    expect(apiPost).toHaveBeenCalledWith('/ai/conversations/conv-2/suggest-reply', 'tenant-1', {});
  });

  it('throws when API returns not ok', async () => {
    const apiPost = jest.fn().mockResolvedValue({ ok: false });
    await expect(handleAiEvent(baseEvent, { log: () => undefined, apiPost })).rejects.toThrow(
      'summarize API failed',
    );
  });
});
