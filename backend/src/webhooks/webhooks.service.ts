import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, LeadSource } from '@prisma/client';
import { verifyHmacSignature } from '../common/utils';
import { AuditService } from '../audit/audit.service';
import { LeadsService } from '../leads/leads.service';
import { ConversationsService } from '../conversations/conversations.service';
import { TenantConfigService } from '../config/config.service';

const CHATWOOT_CONFIG_KEY = 'chatwootWebhookSecret';
const N8N_CONFIG_KEY = 'n8nWebhookSecret';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly config: ConfigService,
    private readonly tenantConfig: TenantConfigService,
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
    const secret = await this.resolveWebhookSecret(
      tenantId,
      CHATWOOT_CONFIG_KEY,
      'CHATWOOT_WEBHOOK_SECRET',
    );
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
    const secret = await this.resolveWebhookSecret(tenantId, N8N_CONFIG_KEY, 'N8N_WEBHOOK_SECRET');
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

  /**
   * Prefer per-tenant secret from TenantConfig; fall back to global env (compat).
   */
  async resolveWebhookSecret(tenantId: string, configKey: string, envKey: string): Promise<string> {
    const row = await this.tenantConfig.get(tenantId, configKey);
    const fromTenant = extractConfigSecret(row?.value);
    if (fromTenant) return fromTenant;
    return this.config.get<string>(envKey, '');
  }
}

/** Accept JSON string or `{ "secret": "..." }`. */
export function extractConfigSecret(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (value && typeof value === 'object' && !Array.isArray(value) && 'secret' in value) {
    const secret = (value as { secret: unknown }).secret;
    if (typeof secret === 'string' && secret.length > 0) return secret;
  }
  return null;
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
