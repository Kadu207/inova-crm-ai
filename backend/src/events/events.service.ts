import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateCorrelationId, generateIdempotencyKey } from '../common/utils';

interface DomainEventEnvelope {
  eventType: string;
  tenantId: string;
  correlationId: string;
  idempotencyKey: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private readonly exchange: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.exchange = this.config.get<string>('RABBITMQ_EXCHANGE', 'crm.events');
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
      this.flushTimer = setInterval(() => {
        void this.flushOutbox();
      }, 10_000);
    } catch (err) {
      this.logger.warn('RabbitMQ unavailable — outbox will queue locally', err);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async connect(): Promise<void> {
    const url = this.config.get<string>('RABBITMQ_URL');
    if (!url) {
      return;
    }
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
    this.logger.log(`Connected to RabbitMQ exchange: ${this.exchange}`);
  }

  async publish(
    tenantId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const correlationId = generateCorrelationId();
    const idempotencyKey = generateIdempotencyKey(eventType);

    await this.prisma.outboxEvent.create({
      data: {
        tenantId,
        eventType,
        correlationId,
        idempotencyKey,
        payload: payload as Prisma.InputJsonValue,
      },
    });

    await this.flushOutbox();
  }

  async flushOutbox(): Promise<void> {
    if (!this.channel) {
      return;
    }

    const pending = await this.prisma.outboxEvent.findMany({
      where: { publishedAt: null },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    for (const event of pending) {
      const envelope: DomainEventEnvelope = {
        eventType: event.eventType,
        tenantId: event.tenantId,
        correlationId: event.correlationId,
        idempotencyKey: event.idempotencyKey,
        timestamp: event.createdAt.toISOString(),
        payload: event.payload as Record<string, unknown>,
      };

      try {
        this.channel.publish(
          this.exchange,
          event.eventType,
          Buffer.from(JSON.stringify(envelope)),
          { persistent: true, contentType: 'application/json' },
        );
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { publishedAt: new Date() },
        });
      } catch (err) {
        this.logger.error(`Failed to publish event ${event.id}`, err);
      }
    }
  }
}
