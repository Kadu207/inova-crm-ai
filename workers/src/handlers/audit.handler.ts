import { DomainEventEnvelope } from '../types';

export interface AuditHandlerDeps {
  log: (msg: string, meta?: Record<string, unknown>) => void;
  persist?: (entry: {
    tenantId: string;
    eventType: string;
    entityType: string;
    entityId?: string;
    metadata: Record<string, unknown>;
  }) => Promise<void>;
}

export async function handleAuditEvent(
  event: DomainEventEnvelope,
  deps: AuditHandlerDeps,
): Promise<void> {
  if (!event.tenantId) {
    throw new Error('Event missing tenantId');
  }

  const entityType = event.eventType.split('.')[0] ?? 'unknown';
  const entityId =
    typeof event.payload.entityId === 'string'
      ? event.payload.entityId
      : typeof event.payload.leadId === 'string'
        ? event.payload.leadId
        : typeof event.payload.invoiceId === 'string'
          ? event.payload.invoiceId
          : undefined;

  const entry = {
    tenantId: event.tenantId,
    eventType: event.eventType,
    entityType,
    entityId,
    metadata: event.payload,
  };

  if (deps.persist) {
    await deps.persist(entry);
  }

  deps.log('Audit recorded', entry);
}
