/**
 * Spec 031 — in-process fallback when API claim unavailable (tests / local).
 */
const processedKeys = new Set<string>();

export function claimIdempotencyMemory(
  tenantId: string,
  idempotencyKey: string,
): 'claimed' | 'duplicate' {
  const key = `${tenantId}:${idempotencyKey}`;
  if (processedKeys.has(key)) {
    return 'duplicate';
  }
  processedKeys.add(key);
  return 'claimed';
}

export function releaseIdempotencyMemory(tenantId: string, idempotencyKey: string): void {
  processedKeys.delete(`${tenantId}:${idempotencyKey}`);
}

/** Test helper — clear memory store between cases. */
export function resetIdempotencyMemory(): void {
  processedKeys.clear();
}
