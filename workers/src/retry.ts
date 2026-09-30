/** Spec 031 — exponential backoff helpers for HTTP / consumer retries. */

export const MAX_EVENT_RETRIES = 5;
export const MAX_HTTP_RETRIES = 3;

export function backoffMs(attempt: number, baseMs = 250, maxMs = 10_000): number {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt));
  const jitter = Math.floor(Math.random() * Math.min(100, exp / 4));
  return exp + jitter;
}

export function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export function parseRetryCount(headers: Record<string, unknown> | undefined): number {
  const raw = headers?.['x-retry'];
  const n = typeof raw === 'number' ? raw : Number(raw ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
