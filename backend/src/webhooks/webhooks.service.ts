import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction } from '@prisma/client';
import { verifyHmacSignature } from '../common/utils';
import { AuditService } from '../audit/audit.service';
import { LeadsService } from '../leads/leads.service';
import { ConversationsService } from '../conversations/conversations.service';
import { LeadSource } from '@prisma/client';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly leads: LeadsService,
    private readonly conversations: ConversationsService,
  ) {}

  async handleChatwoot(
    rawBody: string,
    signature: string | undefined,
    tenantId: string,
    payload: ChatwootWebhookPayload,
  ): Promise<{ received: boolean }> {
    const secret = this.config.get<string>('CHATWOOT_WEBHOOK_SECRET', '');
    if (!verifyHmacSignature(rawBody, signature, secret)) {
      throw new UnauthorizedException('Invalid Chatwoot webhook signature');
    }

    await this.audit.log({
      tenantId,
      action: AuditAction.WEBHOOK,
      entityType: 'chatwoot',
      metadata: { event: payload.event },
    });

    if (payload.event === 'conversation_created' && payload.conversation) {
      await this.conversations.create(tenantId, {
        chatwootId: payload.conversation.id,
        channel: payload.conversation.channel,
      });
    }

    if (payload.event === 'message_created' && payload.content) {
      await this.leads.create(tenantId, {
        title: `Lead from Chatwoot: ${payload.content.slice(0, 80)}`,
        source: LeadSource.CHATWOOT,
      });
    }

    return { received: true };
  }

  async handleN8n(
    rawBody: string,
    signature: string | undefined,
    tenantId: string,
    payload: N8nWebhookPayload,
  ): Promise<{ received: boolean }> {
    const secret = this.config.get<string>('N8N_WEBHOOK_SECRET', '');
    if (!verifyHmacSignature(rawBody, signature, secret)) {
      throw new UnauthorizedException('Invalid n8n webhook signature');
    }

    if (!payload.workflowId) {
      throw new BadRequestException('workflowId required');
    }

    await this.audit.log({
      tenantId,
      action: AuditAction.WEBHOOK,
      entityType: 'n8n',
      metadata: { workflowId: payload.workflowId, status: payload.status },
    });

    return { received: true };
  }
}

export interface ChatwootWebhookPayload {
  event: string;
  content?: string;
  conversation?: { id: number; channel?: string };
}

export interface N8nWebhookPayload {
  workflowId: string;
  status?: string;
  data?: Record<string, unknown>;
}
