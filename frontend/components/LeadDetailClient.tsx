'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('NEW');
  const [score, setScore] = useState('0');

  const load = useCallback(async () => {
    const result = await apiFetch<LeadRow>(`/leads/${id}`);
    if (!result.ok) {
      setError(result.error.message);
      setLead(null);
      return;
    }
    setError(null);
    setLead(result.data);
    setTitle(result.data.title);
    setNotes(result.data.notes ?? '');
    setStatus(result.data.status);
    setScore(String(result.data.score ?? 0));
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

  async function removeLead() {
    if (!lead) return;
    setBusy(true);
    const result = await apiFetch<void>(`/leads/${lead.id}`, { method: 'DELETE' });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      setConfirmDelete(false);
      return;
    }
    router.push('/leads');
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!lead) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    const result = await apiFetch<LeadRow>(`/leads/${lead.id}`, {
      method: 'PATCH',
      body: {
        title: trimmed,
        notes: notes.trim() || undefined,
        status,
        score: Number.parseInt(score, 10) || 0,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setLead(result.data);
    setEditing(false);
    setError(null);
  }

  if (!lead && !error) {
    return (
      <>
        <PageHeader eyebrow="CRM" title="Lead" description="Carregando\u2026" />
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
        description={`Origem ${lead.source} \u00b7 criado ${formatDate(lead.createdAt)}`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/leads" className="btn-ghost">
              Voltar
            </Link>
            <button
              type="button"
              className="btn-ghost"
              disabled={busy}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? 'Cancelar' : 'Editar'}
            </button>
            <button
              type="button"
              className="btn-ghost text-bad"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              Excluir
            </button>
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
      {editing ? (
        <form className="card-panel space-y-4" onSubmit={(e) => void save(e)}>
          <label className="block text-sm text-smoke">
            Titulo
            <input
              className="input-field mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm text-smoke">
            Status
            <select
              className="input-field mt-1"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="UNQUALIFIED">UNQUALIFIED</option>
              <option value="CONVERTED">CONVERTED</option>
              <option value="LOST">LOST</option>
            </select>
          </label>
          <label className="block text-sm text-smoke">
            Score
            <input
              type="number"
              min="0"
              className="input-field mt-1"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </label>
          <label className="block text-sm text-smoke">
            Notas
            <textarea
              className="input-field mt-1 min-h-[5rem]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={busy || !title.trim()}>
            {busy ? 'Salvando\u2026' : 'Salvar'}
          </button>
        </form>
      ) : (
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
            <p className="whitespace-pre-wrap text-sm text-smoke">
              {lead.notes?.trim() || 'Sem notas.'}
            </p>
          </section>
        </div>
      )}
      <ConfirmDeleteModal
        open={confirmDelete}
        busy={busy}
        entityLabel={lead.title}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void removeLead()}
      />
    </>
  );
}
