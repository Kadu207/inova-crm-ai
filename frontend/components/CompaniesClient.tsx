'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CompanyCreateModal } from '@/components/CompanyCreateModal';
import { EmptyState } from '@/components/EmptyState';
import { EntityCard } from '@/components/EntityCard';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { apiFetch } from '@/lib/api';

export type CompanyRow = {
  id: string;
  name: string;
  document?: string | null;
  website?: string | null;
  industry?: string | null;
  createdAt: string;
  updatedAt: string;
};

function metaLine(c: CompanyRow): string {
  return [c.document, c.industry, c.website].filter(Boolean).join(' · ');
}

export function CompaniesClient() {
  const [items, setItems] = useState<CompanyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load() {
    const result = await apiFetch<CompanyRow[]>('/companies');
    if (!result.ok) {
      setError(result.error.message);
      setItems([]);
      return;
    }
    setError(null);
    setItems(result.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(input: {
    name: string;
    document?: string;
    website?: string;
    industry?: string;
  }) {
    setCreating(true);
    const result = await apiFetch<CompanyRow>('/companies', {
      method: 'POST',
      body: input,
    });
    setCreating(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setCreateOpen(false);
    await load();
  }

  if (items === null && !error) {
    return (
      <>
        <PageHeader
          eyebrow="CRM"
          title="Empresas"
          description={'Contas e organiza\u00e7\u00f5es vinculadas ao tenant.'}
        />
        <LoadingState />
      </>
    );
  }

  const rows = items ?? [];

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Empresas"
        description={'Contas e organiza\u00e7\u00f5es vinculadas ao tenant.'}
        action={
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            Nova empresa
          </button>
        }
      />
      {error ? (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma empresa cadastrada"
          description="Cadastre empresas para vincular contatos, oportunidades e contratos."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((c) => (
              <EntityCard
                key={c.id}
                title={c.name}
                meta={metaLine(c) ? <p>{metaLine(c)}</p> : undefined}
                actions={
                  <Link href={`/empresas/${c.id}`} className="btn-ghost text-xs">
                    Detalhe
                  </Link>
                }
              />
            ))}
          </div>
          <div className="card-panel table-scroll hidden md:block">
            <table className="w-full min-w-[32rem] text-left text-sm text-bone">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-faint">
                <tr>
                  <th className="py-2 pr-4 font-medium">Nome</th>
                  <th className="py-2 pr-4 font-medium">Detalhes</th>
                  <th className="py-2 font-medium">{'A\u00e7\u00f5es'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4">
                      <Link href={`/empresas/${c.id}`} className="text-bone hover:text-flame">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-smoke">{metaLine(c) || '\u2014'}</td>
                    <td className="py-3">
                      <Link href={`/empresas/${c.id}`} className="btn-ghost text-xs">
                        Detalhe
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <CompanyCreateModal
        open={createOpen}
        busy={creating}
        onClose={() => setCreateOpen(false)}
        onSubmit={(input) => void handleCreate(input)}
      />
    </>
  );
}
