'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { EntityCard } from '@/components/EntityCard';
import { ErrorState } from '@/components/ErrorState';
import { LeadCreateModal } from '@/components/LeadCreateModal';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { leadStatusTone, StatusBadge } from '@/components/StatusBadge';
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

function LeadActions({
  lead,
  busyId,
  onQualify,
  onConvert,
}: {
  lead: LeadRow;
  busyId: string | null;
  onQualify: (id: string) => void;
  onConvert: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/leads/${lead.id}`} className="btn-ghost text-xs">
        Detalhe
      </Link>
      {lead.status !== 'QUALIFIED' && lead.status !== 'CONVERTED' ? (
        <button
          type="button"
          className="btn-primary text-xs"
          disabled={busyId === lead.id}
          onClick={() => onQualify(lead.id)}
        >
          Qualificar
        </button>
      ) : null}
      {lead.status !== 'CONVERTED' && lead.status !== 'LOST' ? (
        <button
          type="button"
          className="btn-ghost text-xs"
          disabled={busyId === lead.id}
          onClick={() => onConvert(lead.id)}
        >
          Converter
        </button>
      ) : null}
    </div>
  );
}

export function LeadsClient() {
  const [items, setItems] = useState<LeadRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load() {
    const result = await apiFetch<LeadRow[]>('/leads');
    if (!result.ok) {
      setError(result.error.message);
      setItems([]);
      return;
    }
    setError(null);
    setItems(result.data);
  }

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

  async function qualify(id: string) {
    setBusyId(id);
    const result = await apiFetch<LeadRow>(`/leads/${id}/qualify`, {
      method: 'POST',
      body: { score: 80 },
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await load();
  }

  async function convert(id: string) {
    setBusyId(id);
    const result = await apiFetch<{ lead: LeadRow }>(`/leads/${id}/convert`, {
      method: 'POST',
      body: {},
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await load();
  }

  async function createLead(input: { title: string; notes?: string; source: string }) {
    setCreating(true);
    const result = await apiFetch<LeadRow>('/leads', {
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
          title="Leads"
          description="Entrada do funil — Chatwoot, formulários e importação."
        />
        <LoadingState />
      </>
    );
  }

  if (error && items === null) {
    return (
      <>
        <PageHeader
          eyebrow="CRM"
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
        eyebrow="CRM"
        title="Leads"
        description="Entrada do funil — Chatwoot, formulários e importação."
        action={
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            + Novo lead
          </button>
        }
      />
      <LeadCreateModal
        open={createOpen}
        busy={creating}
        onClose={() => setCreateOpen(false)}
        onSubmit={(input) => void createLead(input)}
      />
      {error ? (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      ) : null}
      {leads.length === 0 ? (
        <EmptyState
          title="Nenhum lead"
          description="Crie um lead ou aguarde sync via Chatwoot / importação."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {leads.map((lead) => (
              <EntityCard
                key={lead.id}
                title={lead.title}
                badge={<StatusBadge label={lead.status} tone={leadStatusTone(lead.status)} />}
                meta={
                  <p>
                    {lead.source} · score {lead.score} · {formatDate(lead.createdAt)}
                  </p>
                }
                actions={
                  <LeadActions
                    lead={lead}
                    busyId={busyId}
                    onQualify={(id) => void qualify(id)}
                    onConvert={(id) => void convert(id)}
                  />
                }
              />
            ))}
          </div>

          <div className="card-panel table-scroll hidden md:block">
            <table className="w-full min-w-[40rem] text-left text-sm text-bone">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-faint">
                <tr>
                  <th className="py-2 pr-4 font-medium">Título</th>
                  <th className="py-2 pr-4 font-medium">Origem</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 pr-4 font-medium">Criado</th>
                  <th className="py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leads.map((lead) => (
                  <tr key={lead.id} className="align-top">
                    <td className="max-w-md break-words py-3 pr-4">
                      <Link href={`/leads/${lead.id}`} className="text-bone hover:text-flame">
                        {lead.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-smoke">{lead.source}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge label={lead.status} tone={leadStatusTone(lead.status)} />
                    </td>
                    <td className="py-3 pr-4">{lead.score}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-smoke">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="py-3">
                      <LeadActions
                        lead={lead}
                        busyId={busyId}
                        onQualify={(id) => void qualify(id)}
                        onConvert={(id) => void convert(id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
