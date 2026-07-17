'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { getApiBaseUrl, loginRequest } from '@/lib/api';
import { setSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [tenantSlug, setTenantSlug] = useState('demo');
  const [email, setEmail] = useState('admin@demo.inovatitech.com.br');
  const [password, setPassword] = useState('InovaDemo@2026');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await loginRequest({ email, password, tenantSlug });
    setLoading(false);

    if (!result.ok) {
      setError(result.error.message || 'Falha no login');
      return;
    }

    setSession(result.data);
    router.replace('/');
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-void px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="sr-only">Inova CRM AI — Login</h1>
          <BrandLogo />
          <p className="mt-2 text-sm text-smoke">Acesse sua conta do tenant</p>
        </div>
        <form className="card-panel space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="tenantSlug" className="mb-1 block text-sm text-smoke">
              Tenant (slug)
            </label>
            <input
              id="tenantSlug"
              type="text"
              className="input-field"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              placeholder="demo"
              autoComplete="organization"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-smoke">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-smoke">
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              minLength={8}
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
          <p className="text-center text-xs text-faint">
            API: {getApiBaseUrl()} — seed local: tenant <code>demo</code>
          </p>
        </form>
      </div>
    </div>
  );
}
