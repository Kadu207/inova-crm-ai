/**
 * HTTP client for backend API.
 * Domain rules should prefer API calls over direct DB access.
 * Spec 031: retry with exponential backoff on 5xx / network errors.
 */

import { backoffMs, isRetryableHttpStatus, MAX_HTTP_RETRIES } from './retry';

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  async post(path: string, tenantId: string, body: Record<string, unknown>): Promise<Response> {
    return this.request('POST', path, tenantId, body);
  }

  async patch(path: string, tenantId: string, body: Record<string, unknown>): Promise<Response> {
    return this.request('PATCH', path, tenantId, body);
  }

  /**
   * Claim idempotency key via PlatformApi. Returns duplicate=true if already claimed.
   */
  async claimIdempotency(
    tenantId: string,
    idempotencyKey: string,
    eventType?: string,
  ): Promise<'claimed' | 'duplicate'> {
    const res = await this.post('/platform/idempotency/claim', tenantId, {
      tenantId,
      idempotencyKey,
      eventType,
    });
    if (!res.ok) {
      // Fail-open on claim API errors — process once; Redis/API may be down.
      return 'claimed';
    }
    const json = (await res.json()) as { status?: string; duplicate?: boolean };
    if (json.duplicate || json.status === 'duplicate') {
      return 'duplicate';
    }
    return 'claimed';
  }

  /** Release claim after failed processing so retries can re-claim. */
  async releaseIdempotency(tenantId: string, idempotencyKey: string): Promise<void> {
    await this.post('/platform/idempotency/release', tenantId, {
      tenantId,
      idempotencyKey,
    }).catch(() => undefined);
  }

  private async request(
    method: 'POST' | 'PATCH',
    path: string,
    tenantId: string,
    body: Record<string, unknown>,
  ): Promise<Response> {
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_HTTP_RETRIES; attempt++) {
      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
            'x-tenant-id': tenantId,
          },
          body: JSON.stringify(body),
        });
        if (res.ok || !isRetryableHttpStatus(res.status) || attempt === MAX_HTTP_RETRIES - 1) {
          return res;
        }
        await sleep(backoffMs(attempt));
      } catch (err) {
        lastError = err;
        if (attempt === MAX_HTTP_RETRIES - 1) {
          throw err;
        }
        await sleep(backoffMs(attempt));
      }
    }
    throw lastError instanceof Error ? lastError : new Error('HTTP request failed');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
