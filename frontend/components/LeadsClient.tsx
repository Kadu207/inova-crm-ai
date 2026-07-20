'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { apiFetch } from '@/lib/api';

export type LeadRow = {
  id: string;
  title: string;
  status: string;
  source: string;
  score: number;
  notes?: string | null;
  createdAt: string;
};

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function LeadsClient() {
  const [items, setItems] = useState<LeadRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await apiFetch<LeadRow[]>('/leads');
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error.message);
        setItems([]);
        return;
      }
      setError(null);
      setItems(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null && !error) {
    return (
      <>
        <PageHeader
          title="Leads"
          description="Entrada do funil — Chatwoot, formulários e importação."
        />
        <LoadingState />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Leads"
          description="Entrada do funil — Chatwoot, formulários e importação."
        />
        <ErrorState message={error} />
      </>
    );
  }

  const leads = items ?? [];

  return (
    <>
      <PageHeader
        title="Leads"
        description="Entrada do funil — Chatwoot, formulários e importação."
        action={<button className="btn-primary">Novo lead</button>}
      />
      {leads.length === 0 ? (
        <EmptyState
          title="Nenhum lead"
          description="Leads chegam via Chatwoot, formulários ou importação CSV."
        />
      ) : (
        <div className="card-panel overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm text-bone">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2 pr-4 font-medium">Título</th>
                <th className="py-2 pr-4 font-medium">Origem</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Score</th>
                <th className="py-2 font-medium">Criado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="max-w-md break-words py-3 pr-4">{lead.title}</td>
                  <td className="py-3 pr-4">{lead.source}</td>
                  <td className="py-3 pr-4">{lead.status}</td>
                  <td className="py-3 pr-4">{lead.score}</td>
                  <td className="py-3 whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
