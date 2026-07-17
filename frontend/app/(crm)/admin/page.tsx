import { PageHeader } from '@/components/PageHeader';

const TENANT_STUBS = [
  { id: 'tenant-demo', name: 'Demo Inova', plan: 'trial', status: 'active' },
  { id: 'tenant-acme', name: 'Acme Corp', plan: 'pro', status: 'active' },
];

export default function AdminPage() {
  return (
    <>
      <PageHeader
        title="Admin SaaS"
        description="Super-tenant Fase 7 — provisionamento, quotas e suspensão."
        action={<button className="btn-primary">Novo tenant</button>}
      />
      <div className="mb-6 rounded-lg border border-flame/30 bg-flame/5 p-4 text-sm text-smoke">
        Acesso restrito ao super-admin. Tenants listados abaixo são stubs até a API admin
        (`/v1/admin/tenants`) estar disponível.
      </div>
      <div className="card-panel table-scroll overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-faint">
              <th className="pb-3 pr-4 font-medium">ID</th>
              <th className="pb-3 pr-4 font-medium">Nome</th>
              <th className="pb-3 pr-4 font-medium">Plano</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {TENANT_STUBS.map((tenant) => (
              <tr key={tenant.id} className="border-b border-line last:border-0">
                <td className="py-3 pr-4 font-mono text-xs text-smoke">{tenant.id}</td>
                <td className="py-3 pr-4 text-bone">{tenant.name}</td>
                <td className="py-3 pr-4 text-smoke">{tenant.plan}</td>
                <td className="py-3">
                  <span className="rounded-full bg-ok/15 px-2 py-0.5 text-xs text-ok">
                    {tenant.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-faint">
        Endpoint futuro: GET /v1/admin/tenants (super-tenant only, auditado).
      </p>
    </>
  );
}
