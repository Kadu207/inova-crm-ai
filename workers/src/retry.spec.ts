import { backoffMs, isRetryableHttpStatus, parseRetryCount, MAX_EVENT_RETRIES } from './retry';

describe('retry helpers', () => {
  it('parseRetryCount reads x-retry header', () => {
    expect(parseRetryCount({ 'x-retry': 2 })).toBe(2);
    expect(parseRetryCount({ 'x-retry': '3' })).toBe(3);
    expect(parseRetryCount(undefined)).toBe(0);
  });

  it('isRetryableHttpStatus covers 5xx and 429', () => {
    expect(isRetryableHttpStatus(500)).toBe(true);
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(400)).toBe(false);
  });

  it('backoffMs grows with attempt and stays bounded', () => {
    const a0 = backoffMs(0, 100, 1000);
    const a3 = backoffMs(3, 100, 1000);
    expect(a0).toBeGreaterThanOrEqual(100);
    expect(a3).toBeGreaterThanOrEqual(a0);
    expect(a3).toBeLessThanOrEqual(1100);
  });

  it('exposes max event retries', () => {
    expect(MAX_EVENT_RETRIES).toBe(5);
  });
});
