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
      void processMessage(channel, msg, queue, api);
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
): Promise<void> {
  if (!msg) return;

  try {
    const event = JSON.parse(msg.content.toString()) as DomainEventEnvelope;

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
    log('Consumer error', { queue, error: String(err) });
    channel.nack(msg, false, false);
  }
}
