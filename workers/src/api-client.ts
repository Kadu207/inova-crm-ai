/**
 * HTTP client for backend API.
 * Domain rules should prefer API calls over direct DB access.
 */
export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  async post(path: string, tenantId: string, body: Record<string, unknown>): Promise<Response> {
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(body),
    });
  }

  async patch(path: string, tenantId: string, body: Record<string, unknown>): Promise<Response> {
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
    return fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(body),
    });
  }
}
