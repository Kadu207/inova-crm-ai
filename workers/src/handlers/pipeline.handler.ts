import { DomainEventEnvelope } from '../types';

export interface PipelineHandlerDeps {
  log: (msg: string, meta?: Record<string, unknown>) => void;
}

export async function handlePipelineEvent(
  event: DomainEventEnvelope,
  deps: PipelineHandlerDeps,
): Promise<void> {
  if (!event.tenantId) {
    throw new Error('Event missing tenantId');
  }

  switch (event.eventType) {
    case 'lead.qualified':
    case 'lead.converted':
    case 'opportunity.created':
    case 'opportunity.stage.changed':
    case 'opportunity.won':
    case 'opportunity.lost':
    case 'conversation.resolved':
      deps.log(`Pipeline: ${event.eventType}`, {
        tenantId: event.tenantId,
        payload: event.payload,
      });
      break;
    default:
      deps.log('Unhandled pipeline event', { eventType: event.eventType });
  }
}
