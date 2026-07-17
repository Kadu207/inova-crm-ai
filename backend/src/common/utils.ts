import { createHmac, timingSafeEqual } from 'crypto';
import { randomUUID } from 'crypto';

export function generateCorrelationId(): string {
  return randomUUID();
}

export function generateIdempotencyKey(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export function verifyHmacSignature(
  payload: string,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) {
    return false;
  }
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(sigBuffer, expectedBuffer);
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
