import { toSafeWebhookSubscription } from './webhook-subscriptions.service';
import { WebhookSubscription } from '@prisma/client';

describe('toSafeWebhookSubscription', () => {
  it('masks secret and never returns clear text (F-01)', () => {
    const row = {
      id: 'wh_1',
      tenantId: 't1',
      url: 'https://example.com/hook',
      secret: 'super-secret-hmac-key',
      eventTypes: ['lead.created'],
      active: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    } as WebhookSubscription;

    const safe = toSafeWebhookSubscription(row);
    expect(safe).not.toHaveProperty('secret');
    expect(safe.secretMasked).toBe('********');
    expect(JSON.stringify(safe)).not.toContain('super-secret-hmac-key');
    expect(safe.url).toBe(row.url);
  });

  it('returns null masked when secret empty', () => {
    const row = {
      id: 'wh_2',
      tenantId: 't1',
      url: 'https://example.com/hook',
      secret: '',
      eventTypes: [],
      active: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WebhookSubscription;
    expect(toSafeWebhookSubscription(row).secretMasked).toBeNull();
  });
});
