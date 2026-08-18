import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import { WebhooksService, extractConfigSecret } from './webhooks.service';
import { AuditService } from '../audit/audit.service';
import { LeadsService } from '../leads/leads.service';
import { ConversationsService } from '../conversations/conversations.service';
import { TenantConfigService } from '../config/config.service';

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

describe('WebhooksService', () => {
  let service: WebhooksService;
  const config = { get: jest.fn() };
  const tenantConfig = { get: jest.fn() };
  const audit = { log: jest.fn() };
  const leads = { create: jest.fn() };
  const conversations = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    config.get.mockReturnValue('global-secret');
    tenantConfig.get.mockResolvedValue(null);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: ConfigService, useValue: config },
        { provide: TenantConfigService, useValue: tenantConfig },
        { provide: AuditService, useValue: audit },
        { provide: LeadsService, useValue: leads },
        { provide: ConversationsService, useValue: conversations },
      ],
    }).compile();
    service = module.get(WebhooksService);
  });

  describe('extractConfigSecret', () => {
    it('reads string or nested secret', () => {
      expect(extractConfigSecret('abc')).toBe('abc');
      expect(extractConfigSecret({ secret: 'xyz' })).toBe('xyz');
      expect(extractConfigSecret(null)).toBeNull();
    });
  });

  it('uses per-tenant Chatwoot secret when configured', async () => {
    tenantConfig.get.mockResolvedValue({ value: 'tenant-secret' });
    const body = '{"event":"noop"}';
    const result = await service.handleChatwoot(body, sign(body, 'tenant-secret'), 't1', {
      event: 'noop',
    });
    expect(result.received).toBe(true);
    expect(tenantConfig.get).toHaveBeenCalledWith('t1', 'chatwootWebhookSecret');
    expect(config.get).not.toHaveBeenCalled();
  });

  it('falls back to global env secret when tenant config missing', async () => {
    tenantConfig.get.mockResolvedValue(null);
    config.get.mockReturnValue('global-secret');
    const body = '{"workflowId":"w1"}';
    await service.handleN8n(body, sign(body, 'global-secret'), 't1', {
      workflowId: 'w1',
    });
    expect(config.get).toHaveBeenCalledWith('N8N_WEBHOOK_SECRET', '');
  });

  it('rejects invalid signature', async () => {
    await expect(
      service.handleChatwoot('{}', 'sha256=dead', 't1', { event: 'noop' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
