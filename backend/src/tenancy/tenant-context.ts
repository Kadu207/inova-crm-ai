import { AsyncLocalStorage } from 'node:async_hooks';

type TenantStore = { tenantId: string };

const storage = new AsyncLocalStorage<TenantStore>();

export function getRequestTenantId(): string | undefined {
  return storage.getStore()?.tenantId;
}

export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return storage.run({ tenantId }, fn);
}
