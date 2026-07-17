import { DomainEventEnvelope } from '../types';

const processedKeys = new Set<string>();

export function isDuplicate(idempotencyKey: string): boolean {
  if (processedKeys.has(idempotencyKey)) {
    return true;
  }
  processedKeys.add(idempotencyKey);
  return false;
}

export interface LeadsHandlerDeps {
  log: (msg: string, meta?: Record<string, unknown>) => void;
  apiPost?: (
    path: string,
    tenantId: string,
    body: Record<string, unknown>,
  ) => Promise<{ ok: boolean }>;
}

/**
 * Handles lead.* and conversation.* events for worker-crm-leads.
 * Prefers API calls; falls back to logging when API unavailable.
 */
export async function handleLeadsEvent(
  event: DomainEventEnvelope,
  deps: LeadsHandlerDeps,
): Promise<void> {
  if (!event.tenantId) {
    throw new Error('Event missing tenantId');
  }

  if (isDuplicate(event.idempotencyKey)) {
    deps.log('Skipping duplicate event', { idempotencyKey: event.idempotencyKey });
    return;
  }

  switch (event.eventType) {
    case 'lead.created':
      deps.log('Lead created', { tenantId: event.tenantId, payload: event.payload });
      break;

    case 'lead.updated':
      deps.log('Lead updated', { tenantId: event.tenantId, payload: event.payload });
      break;

    case 'lead.qualified':
      if (deps.apiPost && event.payload.leadId) {
        await deps.apiPost(`/ai/leads/${String(event.payload.leadId)}/qualify`, event.tenantId, {});
      }
      deps.log('Lead qualified', { tenantId: event.tenantId, payload: event.payload });
      break;

    case 'conversation.created':
    case 'conversation.message.received':
      deps.log(`Handled ${event.eventType}`, {
        tenantId: event.tenantId,
        payload: event.payload,
      });
      break;

    default:
      deps.log('Unhandled leads event', { eventType: event.eventType });
  }
}
