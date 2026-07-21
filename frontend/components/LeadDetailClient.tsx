'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ErrorState } from '@/components/ErrorState';
import type { LeadRow } from '@/components/LeadsClient';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { leadStatusTone, StatusBadge } from '@/components/StatusBadge';
import { apiFetch } from '@/lib/api';

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function LeadDetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [lead, setLead] = useState<LeadRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await apiFetch<LeadRow>(`/leads/${id}`);
    if (!result.ok) {
      setError(result.error.message);
      setLead(null);
      return;
    }
    setError(null);
    setLead(result.data);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function qualify() {
    if (!lead) return;
    setBusy(true);
    const result = await apiFetch<LeadRow>(`/leads/${lead.id}/qualify`, {
      method: 'POST',
      body: { score: 80 },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setLead(result.data);
  }

  async function convert() {
    if (!lead) return;
    setBusy(true);
    const result = await apiFetch<{ lead: LeadRow }>(`/leads/${lead.id}/convert`, {
      method: 'POST',
      body: {},
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setLead(result.data.lead);
    router.push('/funil');
  }

  if (!lead && !error) {
    return (
      <>
        <PageHeader eyebrow="CRM" title="Lead" description="Carregando…" />
        <LoadingState />
      </>
    );
  }

  if (error && !lead) {
    return (
      <>
        <PageHeader
          eyebrow="CRM"
          title="Lead"
          description="Detalhe do lead"
          action={
            <Link href="/leads" className="btn-ghost">
              Voltar
            </Link>
          }
        />
        <ErrorState message={error} />
      </>
    );
  }

  if (!lead) return null;

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title={lead.title}
        description={`Origem ${lead.source} · criado ${formatDate(lead.createdAt)}`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/leads" className="btn-ghost">
              Voltar
            </Link>
            {lead.status !== 'QUALIFIED' && lead.status !== 'CONVERTED' ? (
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                onClick={() => void qualify()}
              >
                Qualificar
              </button>
            ) : null}
            {lead.status !== 'CONVERTED' && lead.status !== 'LOST' ? (
              <button
                type="button"
                className="btn-ghost"
                disabled={busy}
                onClick={() => void convert()}
              >
                Converter
              </button>
            ) : null}
          </div>
        }
      />
      {error ? (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-panel space-y-3">
          <h2 className="font-display text-lg text-bone">Resumo</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-smoke">Status</dt>
              <dd>
                <StatusBadge label={lead.status} tone={leadStatusTone(lead.status)} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-smoke">Score</dt>
              <dd className="text-bone">{lead.score}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-smoke">Origem</dt>
              <dd className="text-bone">{lead.source}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-smoke">ID</dt>
              <dd className="truncate font-mono text-xs text-faint">{lead.id}</dd>
            </div>
          </dl>
        </section>
        <section className="card-panel space-y-3">
          <h2 className="font-display text-lg text-bone">Notas</h2>
          <p className="text-sm text-smoke whitespace-pre-wrap">
            {lead.notes?.trim() || 'Sem notas.'}
          </p>
        </section>
      </div>
    </>
  );
}
