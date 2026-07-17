/**
 * Shared port map and event name constants for Inova CRM AI.
 * Keep in sync with infrastructure/docker-compose.*.yml overrides.
 */

export const PORTS = {
  FRONTEND: 9400,
  API: 9401,
  AI: 9402,
  CHATWOOT: 9403,
  N8N: 9404,
  MINIO_API: 9405,
  MINIO_CONSOLE: 9406,
  RABBITMQ_UI: 9407,
  GRAFANA: 9408,
  POSTGRES_HOST: 9410,
} as const;

export const PORT_RANGE = {
  START: 9400,
  END: 9419,
} as const;

export const SERVICE_HOSTS = {
  POSTGRES: 'postgres',
  REDIS: 'redis',
  RABBITMQ: 'rabbitmq',
  MINIO: 'minio',
} as const;

/** RabbitMQ / Redis pub-sub and domain event names */
export const EVENTS = {
  LEAD_CREATED: 'crm.lead.created',
  LEAD_UPDATED: 'crm.lead.updated',
  LEAD_QUALIFIED: 'crm.lead.qualified',
  OPPORTUNITY_CREATED: 'crm.opportunity.created',
  OPPORTUNITY_STAGE_CHANGED: 'crm.opportunity.stage_changed',
  CONTACT_SYNCED: 'crm.contact.synced',
  CONVERSATION_RECEIVED: 'chatwoot.conversation.received',
  CONVERSATION_ASSIGNED: 'chatwoot.conversation.assigned',
  WORKFLOW_TRIGGERED: 'n8n.workflow.triggered',
  WORKFLOW_COMPLETED: 'n8n.workflow.completed',
  WEBHOOK_RECEIVED: 'integration.webhook.received',
  AI_INSIGHT_READY: 'ai.insight.ready',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
export type ServicePort = (typeof PORTS)[keyof typeof PORTS];
