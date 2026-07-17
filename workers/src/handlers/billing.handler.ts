import { DomainEventEnvelope } from '../types';

export interface BillingHandlerDeps {
  log: (msg: string, meta?: Record<string, unknown>) => void;
}

export async function handleBillingEvent(
  event: DomainEventEnvelope,
  deps: BillingHandlerDeps,
): Promise<void> {
  if (!event.tenantId) {
    throw new Error('Event missing tenantId');
  }

  switch (event.eventType) {
    case 'opportunity.won':
      deps.log('Opportunity won — trigger billing draft', {
        tenantId: event.tenantId,
        opportunityId: event.payload.opportunityId,
      });
      break;
    case 'invoice.created':
    case 'invoice.approved':
    case 'invoice.paid':
    case 'invoice.overdue':
      deps.log(`Billing: ${event.eventType}`, {
        tenantId: event.tenantId,
        payload: event.payload,
      });
      break;
    default:
      deps.log('Unhandled billing event', { eventType: event.eventType });
  }
}
