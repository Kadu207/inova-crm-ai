'use client';

import { FormEvent, useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiFetch } from '@/lib/api';
import { getSession } from '@/lib/auth';

type TenantPlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  createdAt: string;
  maxUsers?: number | null;
  maxLeads?: number | null;
  maxStorageMb?: number | null;
  maxAiRequestsDay?: number | null;
};

function statusTone(status: TenantStatus): 'ok' | 'warn' | 'bad' | 'neutral' {
  switch (status) {
    case 'ACTIVE':
      return 'ok';
    case 'TRIAL':
      return 'warn';
    case 'SUSPENDED':
    case 'CANCELLED':
      return 'bad';
    default:
      return 'neutral';
  }
}

function fmtQuota(n: number | null | undefined): string {
  return n == null ? '—' : String(n);
}

export function AdminSaaSClient() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [items, setItems] = useState<TenantRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [quotasTenantId, setQuotasTenantId] = useState<string | null>(null);
  const [savingQuotas, setSavingQuotas] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState<TenantPlan>('STARTER');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [maxUsers, setMaxUsers] = useState('');
  const [maxLeads, setMaxLeads] = useState('');
  const [maxStorageMb, setMaxStorageMb] = useState('');
  const [maxAiRequestsDay, setMaxAiRequestsDay] = useState('');

  async function load() {
    const result = await apiFetch<TenantRow[]>('/saas/tenants');
    if (!result.ok) {
      setError(result.error.message);
      setItems([]);
      return;
    }
    setError(null);
    setItems(result.data);
  }

  useEffect(() => {
    setIsSuperAdmin(getSession()?.role === 'SUPER_ADMIN');
    void load();
  }, []);

  function openQuotas(tenant: TenantRow) {
    setQuotasTenantId(tenant.id);
    setMaxUsers(tenant.maxUsers != null ? String(tenant.maxUsers) : '');
    setMaxLeads(tenant.maxLeads != null ? String(tenant.maxLeads) : '');
    setMaxStorageMb(tenant.maxStorageMb != null ? String(tenant.maxStorageMb) : '');
    setMaxAiRequestsDay(tenant.maxAiRequestsDay != null ? String(tenant.maxAiRequestsDay) : '');
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    const body: Record<string, string> = { name, slug, plan };
    if (adminName.trim() || adminEmail.trim() || adminPassword.trim()) {
      body.adminName = adminName.trim();
      body.adminEmail = adminEmail.trim();
      body.adminPassword = adminPassword;
    }
    const result = await apiFetch<TenantRow>('/saas/tenants', { method: 'POST', body });
    setCreating(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setCreateOpen(false);
    setName('');
    setSlug('');
    setPlan('STARTER');
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    await load();
  }

  async function setStatus(id: string, status: TenantStatus) {
    setStatusBusyId(id);
    const result = await apiFetch<TenantRow>(`/saas/tenants/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
    setStatusBusyId(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await load();
  }

  async function saveQuotas(e: FormEvent) {
    e.preventDefault();
    if (!quotasTenantId) return;
    setSavingQuotas(true);
    const body: Record<string, number> = {};
    if (maxUsers.trim()) body.maxUsers = Number(maxUsers);
    if (maxLeads.trim()) body.maxLeads = Number(maxLeads);
    if (maxStorageMb.trim()) body.maxStorageMb = Number(maxStorageMb);
    if (maxAiRequestsDay.trim()) body.maxAiRequestsDay = Number(maxAiRequestsDay);

    const result = await apiFetch<TenantRow>(`/saas/tenants/${quotasTenantId}/quotas`, {
      method: 'PATCH',
      body,
    });
    setSavingQuotas(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setQuotasTenantId(null);
    await load();
  }

  if (items === null && !error) {
    return (
      <>
        <PageHeader
          eyebrow="SaaS"
          title="Admin SaaS"
          description="Provisionamento de tenants, planos, quotas e status."
        />
        <LoadingState />
      </>
    );
  }

  const rows = items ?? [];
  const quotasTenant = rows.find((t) => t.id === quotasTenantId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="SaaS"
        title="Admin SaaS"
        description="Provisionamento de tenants, planos, quotas e status (SUPER_ADMIN)."
        action={
          isSuperAdmin ? (
            <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
              Novo tenant
            </button>
          ) : undefined
        }
      />

      {!isSuperAdmin ? (
        <div className="mb-6 rounded-lg border border-warn/30 bg-warn/5 p-4 text-sm text-smoke">
          Este usuario nao tem papel <code>SUPER_ADMIN</code>. A API <code>/saas/tenants</code>{' '}
          exige super-admin da plataforma.
        </div>
      ) : null}

      {error ? (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      ) : null}

      {createOpen ? (
        <div className="mb-6 rounded-lg border border-line bg-panel p-4">
          <h2 className="mb-3 text-sm font-medium text-bone">Provisionar tenant</h2>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreate}>
            <label className="block text-xs text-faint">
              Nome
              <input
                className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm text-bone"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="block text-xs text-faint">
              Slug
              <input
                className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm text-bone"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
                pattern="[a-z0-9-]+"
              />
            </label>
            <label className="block text-xs text-faint">
              Plano
              <select
                className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm text-bone"
                value={plan}
                onChange={(e) => setPlan(e.target.value as TenantPlan)}
              >
                <option value="FREE">FREE</option>
                <option value="STARTER">STARTER</option>
                <option value="PROFESSIONAL">PROFESSIONAL</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </label>
            <div className="md:col-span-2 border-t border-line pt-3 text-xs text-faint">
              Admin inicial (opcional — se preenchido, cria usuario ADMIN no tenant)
            </div>
            <label className="block text-xs text-faint">
              Nome admin
              <input
                className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm text-bone"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </label>
            <label className="block text-xs text-faint">
              Email admin
              <input
                type="email"
                className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm text-bone"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </label>
            <label className="block text-xs text-faint md:col-span-2">
              Senha admin (min. 8)
              <input
                type="password"
                className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm text-bone"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                minLength={8}
              />
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'Criando…' : 'Criar tenant'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {quotasTenant ? (
        <div className="mb-6 rounded-lg border border-line bg-panel p-4">
          <h2 className="mb-3 text-sm font-medium text-bone">Quotas — {quotasTenant.slug}</h2>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={saveQuotas}>
            <label className="block text-xs text-faint">
              maxUsers
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm text-bone"
                value={maxUsers}
                onChange={(e) => setMaxUsers(e.target.value)}
              />
            </label>
            <label className="block text-xs text-faint">
              maxLeads
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm text-bone"
                value={maxLeads}
                onChange={(e) => setMaxLeads(e.target.value)}
              />
            </label>
            <label className="block text-xs text-faint">
              maxStorageMb
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm text-bone"
                value={maxStorageMb}
                onChange={(e) => setMaxStorageMb(e.target.value)}
              />
            </label>
            <label className="block text-xs text-faint">
              maxAiRequestsDay
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded border border-line bg-ink px-3 py-2 text-sm text-bone"
                value={maxAiRequestsDay}
                onChange={(e) => setMaxAiRequestsDay(e.target.value)}
              />
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary" disabled={savingQuotas}>
                {savingQuotas ? 'Salvando…' : 'Salvar quotas'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                disabled={savingQuotas}
                onClick={() => setQuotasTenantId(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {rows.length === 0 && !error ? (
        <EmptyState
          title="Nenhum tenant"
          description="Use Novo tenant para provisionar o primeiro cliente."
        />
      ) : (
        <div className="card-panel table-scroll overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-faint">
                <th className="pb-3 pr-4 font-medium">Slug</th>
                <th className="pb-3 pr-4 font-medium">Nome</th>
                <th className="pb-3 pr-4 font-medium">Plano</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Users</th>
                <th className="pb-3 pr-4 font-medium">Leads</th>
                <th className="pb-3 font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tenant) => (
                <tr key={tenant.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs text-smoke">{tenant.slug}</td>
                  <td className="py-3 pr-4 text-bone">{tenant.name}</td>
                  <td className="py-3 pr-4 text-smoke">{tenant.plan}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge label={tenant.status} tone={statusTone(tenant.status)} />
                  </td>
                  <td className="py-3 pr-4 text-smoke">{fmtQuota(tenant.maxUsers)}</td>
                  <td className="py-3 pr-4 text-smoke">{fmtQuota(tenant.maxLeads)}</td>
                  <td className="py-3">
                    {isSuperAdmin ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-ghost text-xs"
                          onClick={() => openQuotas(tenant)}
                        >
                          Quotas
                        </button>
                        {tenant.status !== 'ACTIVE' ? (
                          <button
                            type="button"
                            className="btn-ghost text-xs"
                            disabled={statusBusyId === tenant.id}
                            onClick={() => void setStatus(tenant.id, 'ACTIVE')}
                          >
                            Ativar
                          </button>
                        ) : null}
                        {tenant.status !== 'SUSPENDED' ? (
                          <button
                            type="button"
                            className="btn-ghost text-xs"
                            disabled={statusBusyId === tenant.id}
                            onClick={() => void setStatus(tenant.id, 'SUSPENDED')}
                          >
                            Suspender
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-faint">
        API: GET/POST /saas/tenants · PATCH /saas/tenants/:id/status · PATCH
        /saas/tenants/:id/quotas
      </p>
    </>
  );
}
