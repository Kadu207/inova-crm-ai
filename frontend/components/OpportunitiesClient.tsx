'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { EntityCard } from '@/components/EntityCard';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { OpportunityCreateModal } from '@/components/OpportunityCreateModal';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiFetch } from '@/lib/api';

export type OpportunityRow = {
  id: string;
  title: string;
  pipelineId: string;
  stageId: string;
  status: string;
  value?: string | number | null;
  leadId?: string | null;
  contactId?: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatMoney(value: string | number | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(n)) return String(value ?? '\u2014');
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function statusTone(status: string): 'ok' | 'warn' | 'bad' | 'neutral' {
  switch (status) {
    case 'WON':
      return 'ok';
    case 'LOST':
      return 'bad';
    case 'OPEN':
      return 'warn';
    default:
      return 'neutral';
  }
}

function metaLine(o: OpportunityRow): string {
  return [formatMoney(o.value), o.status].filter(Boolean).join(' \u00b7 ');
}

export function OpportunitiesClient() {
  const [items, setItems] = useState<OpportunityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load() {
    const result = await apiFetch<OpportunityRow[]>('/opportunities');
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
    title: string;
    pipelineId: string;
    stageId: string;
    value?: number;
  }) {
    setCreating(true);
    const result = await apiFetch<OpportunityRow>('/opportunities', {
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
          title="Oportunidades"
          description="Deals em andamento com valor, estagio e status."
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
        title="Oportunidades"
        description="Deals em andamento com valor, estagio e status."
        action={
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            Nova oportunidade
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
          title="Nenhuma oportunidade"
          description="Converta leads qualificados ou crie oportunidades manualmente."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((o) => (
              <EntityCard
                key={o.id}
                title={o.title}
                badge={<StatusBadge label={o.status} tone={statusTone(o.status)} />}
                meta={metaLine(o) ? <p>{metaLine(o)}</p> : undefined}
                actions={
                  <Link href={`/oportunidades/${o.id}`} className="btn-ghost text-xs">
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
                  <th className="py-2 pr-4 font-medium">{'T\u00edtulo'}</th>
                  <th className="py-2 pr-4 font-medium">Detalhes</th>
                  <th className="py-2 font-medium">{'A\u00e7\u00f5es'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 pr-4">
                      <Link href={`/oportunidades/${o.id}`} className="text-bone hover:text-flame">
                        {o.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-smoke">
                      <span className="mr-2 inline-flex">
                        <StatusBadge label={o.status} tone={statusTone(o.status)} />
                      </span>
                      {formatMoney(o.value)}
                    </td>
                    <td className="py-3">
                      <Link href={`/oportunidades/${o.id}`} className="btn-ghost text-xs">
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
      <OpportunityCreateModal
        open={createOpen}
        busy={creating}
        onClose={() => setCreateOpen(false)}
        onSubmit={(input) => void handleCreate(input)}
      />
    </>
  );
}
