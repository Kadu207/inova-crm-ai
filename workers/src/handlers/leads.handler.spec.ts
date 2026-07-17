import { handleLeadsEvent } from './leads.handler';
import { DomainEventEnvelope } from '../types';

describe('handleLeadsEvent', () => {
  const baseEvent: DomainEventEnvelope = {
    eventType: 'lead.created',
    tenantId: 'tenant-1',
    correlationId: 'corr-1',
    idempotencyKey: 'key-1',
    timestamp: new Date().toISOString(),
    payload: { leadId: 'lead-1' },
  };

  it('processes lead.created event', async () => {
    const logs: string[] = [];
    await handleLeadsEvent(baseEvent, {
      log: (msg) => logs.push(msg),
    });
    expect(logs).toContain('Lead created');
  });

  it('rejects events without tenantId', async () => {
    await expect(
      handleLeadsEvent({ ...baseEvent, tenantId: '' }, { log: () => undefined }),
    ).rejects.toThrow('Event missing tenantId');
  });

  it('skips duplicate idempotency keys', async () => {
    const logs: string[] = [];
    const deps = { log: (msg: string) => logs.push(msg) };

    await handleLeadsEvent({ ...baseEvent, idempotencyKey: 'dup-key' }, deps);
    await handleLeadsEvent({ ...baseEvent, idempotencyKey: 'dup-key' }, deps);

    expect(logs.filter((m) => m === 'Skipping duplicate event')).toHaveLength(1);
  });

  it('calls API on lead.qualified when apiPost provided', async () => {
    const apiPost = jest.fn().mockResolvedValue({ ok: true });
    await handleLeadsEvent(
      {
        ...baseEvent,
        eventType: 'lead.qualified',
        idempotencyKey: 'qualify-key',
        payload: { leadId: 'lead-99' },
      },
      { log: () => undefined, apiPost },
    );
    expect(apiPost).toHaveBeenCalledWith('/ai/leads/lead-99/qualify', 'tenant-1', {});
  });
});
