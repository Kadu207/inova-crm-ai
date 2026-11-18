import { DomainEventEnvelope } from '../types';

export interface AiHandlerDeps {
  log: (msg: string, meta?: Record<string, unknown>) => void;
  apiPost?: (
    path: string,
    tenantId: string,
    body: Record<string, unknown>,
  ) => Promise<{ ok: boolean }>;
}

/**
 * Consumer for ai.* — Spec 034: process ai.assist.requested via Nest toolbelt (API-only).
 */
export async function handleAiEvent(
  event: DomainEventEnvelope,
  deps: AiHandlerDeps,
): Promise<void> {
  if (!event.tenantId) {
    throw new Error('Event missing tenantId');
  }

  switch (event.eventType) {
    case 'ai.assist.requested': {
      const conversationId = String(event.payload.conversationId ?? '');
      const kind = String(event.payload.kind ?? '');
      if (!conversationId || !kind) {
        throw new Error('ai.assist.requested missing conversationId or kind');
      }
      if (!deps.apiPost) {
        deps.log('AI assist queued but API unavailable', {
          tenantId: event.tenantId,
          conversationId,
          kind,
        });
        break;
      }

      if (kind === 'summarize') {
        const res = await deps.apiPost(
          `/ai/conversations/${conversationId}/summarize`,
          event.tenantId,
          {},
        );
        if (!res.ok) throw new Error('summarize API failed');
      } else if (kind === 'reply') {
        const res = await deps.apiPost(
          `/ai/conversations/${conversationId}/suggest-reply`,
          event.tenantId,
          {},
        );
        if (!res.ok) throw new Error('suggest-reply API failed');
      } else if (kind === 'next_step') {
        const res = await deps.apiPost(`/ai/suggest-next-step`, event.tenantId, {
          entityType: 'conversation',
          entityId: conversationId,
          conversationId,
        });
        if (!res.ok) throw new Error('suggest-next-step API failed');
      } else {
        throw new Error(`Unsupported ai.assist kind: ${kind}`);
      }

      deps.log('AI assist completed via API', {
        tenantId: event.tenantId,
        conversationId,
        kind,
      });
      break;
    }

    case 'lead.qualified':
    case 'conversation.message.received':
    case 'ai.job.requested':
    case 'ai.scoring.completed':
    case 'ai.qualification.requested':
    case 'ai.rag.index.requested':
      deps.log(`AI stub: ${event.eventType}`, {
        tenantId: event.tenantId,
        payload: event.payload,
      });
      break;

    default:
      deps.log('Unhandled AI event', { eventType: event.eventType });
  }
}
