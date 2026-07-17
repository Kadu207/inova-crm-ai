export type AuthSession = {
  accessToken: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
};

const STORAGE_KEY = 'inova-crm-auth';

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null;
}

export function getTenantId(): string | null {
  return getSession()?.tenantId ?? null;
}
