/**
 * Domain event envelope — must match docs/events/catalog-v0.md
 */
export interface DomainEventEnvelope {
  eventType: string;
  tenantId: string;
  correlationId: string;
  idempotencyKey: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export const WORKER_QUEUES = {
  LEADS: 'worker-crm-leads',
  PIPELINE: 'worker-crm-pipeline',
  BILLING: 'worker-crm-billing',
  AI: 'worker-crm-ai',
  AUDIT: 'worker-crm-audit',
} as const;

export const ROUTING_KEYS: Record<string, string[]> = {
  [WORKER_QUEUES.LEADS]: [
    'lead.created',
    'lead.updated',
    'lead.qualified',
    'lead.converted',
    'conversation.created',
    'conversation.message.received',
    'contact.merged',
  ],
  [WORKER_QUEUES.PIPELINE]: [
    'lead.qualified',
    'lead.converted',
    'opportunity.created',
    'opportunity.stage.changed',
    'opportunity.won',
    'opportunity.lost',
    'conversation.resolved',
  ],
  [WORKER_QUEUES.BILLING]: [
    'opportunity.won',
    'invoice.created',
    'invoice.approved',
    'invoice.paid',
    'invoice.overdue',
  ],
  [WORKER_QUEUES.AI]: [
    'lead.qualified',
    'conversation.message.received',
    'ai.job.requested',
    'ai.scoring.completed',
  ],
  [WORKER_QUEUES.AUDIT]: [
    'lead.created',
    'lead.deleted',
    'contact.created',
    'contact.updated',
    'company.created',
    'opportunity.won',
    'opportunity.lost',
    'invoice.sent',
    'conversation.message.sent',
    'conversation.assigned',
  ],
};
