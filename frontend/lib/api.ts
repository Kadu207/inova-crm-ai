import { getAccessToken, getTenantId } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:9401';

export type ApiError = {
  status: number;
  message: string;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  tenantId?: string;
  auth?: boolean;
};

function normalizePath(path: string): string {
  if (path.startsWith('/api/')) return path;
  if (path.startsWith('/v1/')) return `/api${path}`;
  if (path.startsWith('/')) return `/api/v1${path}`;
  return `/api/v1/${path}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const { method = 'GET', body, token, tenantId, auth = true } = options;

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const bearer = token ?? (auth ? getAccessToken() : null);
    if (bearer) {
      headers.Authorization = `Bearer ${bearer}`;
    }

    const tenant = tenantId ?? (auth ? getTenantId() : null);
    if (tenant) {
      headers['x-tenant-id'] = tenant;
    }

    const response = await fetch(`${API_BASE}${normalizePath(path)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    if (!response.ok) {
      let message = response.statusText;
      try {
        const payload = (await response.json()) as { message?: string | string[] };
        if (Array.isArray(payload.message)) {
          message = payload.message.join(', ');
        } else if (payload.message) {
          message = payload.message;
        }
      } catch {
        message = (await response.text().catch(() => message)) || message;
      }
      return {
        ok: false,
        error: { status: response.status, message: message || 'Request failed' },
      };
    }

    if (response.status === 204) {
      return { ok: true, data: undefined as T };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: { status: 0, message } };
  }
}

export function getApiBaseUrl(): string {
  return API_BASE;
}

export type AuthResponse = {
  accessToken: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
};

export async function loginRequest(input: {
  email: string;
  password: string;
  tenantSlug: string;
}): Promise<ApiResult<AuthResponse>> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
    auth: false,
  });
}

export async function fetchListStub<T>(resource: string): Promise<ApiResult<T[]>> {
  const result = await apiFetch<{ items: T[] } | T[]>(`/${resource}`);
  if (!result.ok) {
    return result;
  }
  const data = result.data;
  if (Array.isArray(data)) {
    return { ok: true, data };
  }
  return { ok: true, data: data.items ?? [] };
}
