import { createHmac } from 'node:crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WebhookSubscription } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWebhookSubscriptionDto,
  UpdateWebhookSubscriptionDto,
} from './dto/webhook-subscription.dto';

@Injectable()
export class WebhookSubscriptionsService {
  private readonly logger = new Logger(WebhookSubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string): Promise<WebhookSubscription[]> {
    return this.prisma.webhookSubscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<WebhookSubscription> {
    const row = await this.prisma.webhookSubscription.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException(`WebhookSubscription ${id} not found`);
    return row;
  }

  create(tenantId: string, dto: CreateWebhookSubscriptionDto): Promise<WebhookSubscription> {
    return this.prisma.webhookSubscription.create({
      data: {
        tenantId,
        url: dto.url,
        secret: dto.secret,
        eventTypes: dto.eventTypes,
        active: dto.active ?? true,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateWebhookSubscriptionDto,
  ): Promise<WebhookSubscription> {
    await this.findOne(tenantId, id);
    const result = await this.prisma.webhookSubscription.updateMany({
      where: { id, tenantId },
      data: {
        url: dto.url,
        secret: dto.secret,
        eventTypes: dto.eventTypes,
        active: dto.active,
      },
    });
    if (result.count === 0) throw new NotFoundException(`WebhookSubscription ${id} not found`);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.webhookSubscription.deleteMany({ where: { id, tenantId } });
  }

  /**
   * Deliver domain event to active subscriptions matching eventType (HMAC X-Inova-Signature).
   */
  async dispatch(
    tenantId: string,
    eventType: string,
    envelope: Record<string, unknown>,
  ): Promise<{ delivered: number }> {
    const subs = await this.prisma.webhookSubscription.findMany({
      where: {
        tenantId,
        active: true,
        eventTypes: { has: eventType },
      },
    });

    let delivered = 0;
    const body = JSON.stringify(envelope);
    const timestamp = Math.floor(Date.now() / 1000).toString();

    for (const sub of subs) {
      try {
        const payload = `v1:${timestamp}:${body}`;
        const digest = createHmac('sha256', sub.secret).update(payload).digest('hex');
        const res = await fetch(sub.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Inova-Signature': `sha256=${digest}`,
            'X-Inova-Timestamp': timestamp,
          },
          body,
        });
        if (res.ok) {
          delivered += 1;
        } else {
          this.logger.warn(`Webhook ${sub.id} failed status=${res.status} eventType=${eventType}`);
        }
      } catch (err) {
        this.logger.warn(
          `Webhook ${sub.id} error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return { delivered };
  }
}
