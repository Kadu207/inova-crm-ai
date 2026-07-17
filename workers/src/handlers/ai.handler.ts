import { DomainEventEnvelope } from '../types';

export interface AiHandlerDeps {
  log: (msg: string, meta?: Record<string, unknown>) => void;
}

/** Stub consumer for ai.* events — full implementation in Fase 6 */
export async function handleAiEvent(
  event: DomainEventEnvelope,
  deps: AiHandlerDeps,
): Promise<void> {
  if (!event.tenantId) {
    throw new Error('Event missing tenantId');
  }

  switch (event.eventType) {
    case 'lead.qualified':
    case 'conversation.message.received':
    case 'ai.job.requested':
    case 'ai.scoring.completed':
      deps.log(`AI stub: ${event.eventType}`, {
        tenantId: event.tenantId,
        payload: event.payload,
      });
      break;
    default:
      deps.log('Unhandled AI event', { eventType: event.eventType });
  }
}
