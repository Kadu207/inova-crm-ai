import amqp, { Channel, ConsumeMessage } from 'amqplib';
import { ApiClient } from './api-client';
import { DomainEventEnvelope, WORKER_QUEUES, ROUTING_KEYS } from './types';
import {
  handleLeadsEvent,
  handlePipelineEvent,
  handleBillingEvent,
  handleAiEvent,
  handleAuditEvent,
} from './handlers';
import { claimIdempotencyMemory, releaseIdempotencyMemory } from './idempotency';
import { backoffMs, MAX_EVENT_RETRIES, parseRetryCount } from './retry';

const log = (msg: string, meta?: Record<string, unknown>): void => {
  console.log(JSON.stringify({ level: 'info', msg, ...meta, ts: new Date().toISOString() }));
};

export async function startConsumers(): Promise<void> {
  const rabbitUrl = process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';
  const exchange = process.env.RABBITMQ_EXCHANGE ?? 'crm.events';
  const apiBase = process.env.API_BASE_URL ?? 'http://localhost:9401/api/v1';
  const apiToken = process.env.API_TOKEN ?? '';

  const api = apiToken ? new ApiClient(apiBase, apiToken) : null;

  const connection = await amqp.connect(rabbitUrl);
  const channel = await channelSetup(connection.createChannel(), exchange);

  for (const [queue, keys] of Object.entries(ROUTING_KEYS)) {
    await channel.assertQueue(queue, { durable: true });
    for (const key of keys) {
      await channel.bindQueue(queue, exchange, key);
    }

    await channel.consume(queue, (msg) => {
      void processMessage(channel, msg, queue, api, exchange);
    });

    log('Consumer registered', { queue, routingKeys: keys });
  }

  log('All workers running', { queues: Object.values(WORKER_QUEUES) });
}

async function channelSetup(channelPromise: Promise<Channel>, exchange: string): Promise<Channel> {
  const channel = await channelPromise;
  await channel.assertExchange(exchange, 'topic', { durable: true });
  channel.prefetch(10);
  return channel;
}

async function processMessage(
  channel: Channel,
  msg: ConsumeMessage | null,
  queue: string,
  api: ApiClient | null,
  exchange: string,
): Promise<void> {
  if (!msg) return;

  let event: DomainEventEnvelope | null = null;
  let claimed = false;

  try {
    event = JSON.parse(msg.content.toString()) as DomainEventEnvelope;

    const claim = api
      ? await api.claimIdempotency(event.tenantId, event.idempotencyKey, event.eventType)
      : claimIdempotencyMemory(event.tenantId, event.idempotencyKey);

    if (claim === 'duplicate') {
      log('Skipping duplicate event', {
        queue,
        idempotencyKey: event.idempotencyKey,
        tenantId: event.tenantId,
      });
      channel.ack(msg);
      return;
    }
    claimed = true;

    switch (queue) {
      case WORKER_QUEUES.LEADS:
        await handleLeadsEvent(event, {
          log,
          apiPost: api
            ? async (path, tenantId, body) => {
                const res = await api.post(path, tenantId, body);
                return { ok: res.ok };
              }
            : undefined,
          // Already claimed at consumer level — skip second claim
          claimIdempotency: async (): Promise<'claimed' | 'duplicate'> => 'claimed',
        });
        break;
      case WORKER_QUEUES.PIPELINE:
        await handlePipelineEvent(event, { log });
        break;
      case WORKER_QUEUES.BILLING:
        await handleBillingEvent(event, { log });
        break;
      case WORKER_QUEUES.AI:
        await handleAiEvent(event, { log });
        break;
      case WORKER_QUEUES.AUDIT:
        await handleAuditEvent(event, { log });
        break;
      default:
        log('Unknown queue', { queue });
    }

    channel.ack(msg);
  } catch (err) {
    if (claimed && event) {
      if (api) {
        await api.releaseIdempotency(event.tenantId, event.idempotencyKey);
      } else {
        releaseIdempotencyMemory(event.tenantId, event.idempotencyKey);
      }
    }

    const retries = parseRetryCount(msg.properties.headers as Record<string, unknown> | undefined);
    log('Consumer error', { queue, error: String(err), retries });

    if (retries < MAX_EVENT_RETRIES) {
      const content = Buffer.from(msg.content);
      const routingKey = msg.fields.routingKey;
      const headers = {
        ...(msg.properties.headers ?? {}),
        'x-retry': retries + 1,
      };
      // Ack first so broker does not redeliver during backoff wait.
      channel.ack(msg);
      const delay = backoffMs(retries);
      setTimeout(() => {
        try {
          channel.publish(exchange, routingKey, content, {
            persistent: true,
            contentType: 'application/json',
            headers,
          });
          log('Event republished for retry', { queue, retries: retries + 1, delayMs: delay });
        } catch (publishErr) {
          log('Retry publish failed', { error: String(publishErr) });
        }
      }, delay);
      return;
    }

    log('Poison message discarded after max retries', { queue, retries });
    channel.nack(msg, false, false);
  }
}
