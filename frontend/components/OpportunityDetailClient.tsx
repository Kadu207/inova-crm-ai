'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { OpportunityRow } from '@/components/OpportunitiesClient';
import type { PipelineOption } from '@/components/OpportunityCreateModal';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiFetch } from '@/lib/api';

const STATUSES = ['OPEN', 'WON', 'LOST'] as const;

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatMoney(value: string | number | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(n)) return String(value ?? '\u2014');
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function statusTone(status: string): 'ok' | 'warn' | 'bad' {
  switch (status) {
    case 'WON':
      return 'ok';
    case 'LOST':
      return 'bad';
    default:
      return 'warn';
  }
}

export function OpportunityDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [opp, setOpp] = useState<OpportunityRow | null>(null);
  const [pipelines, setPipelines] = useState<PipelineOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [stageId, setStageId] = useState('');
  const [status, setStatus] = useState<string>('OPEN');

  const load = useCallback(async () => {
    const [oppResult, pipelinesResult] = await Promise.all([
      apiFetch<OpportunityRow>(`/opportunities/${id}`),
      apiFetch<PipelineOption[]>('/pipelines'),
    ]);
    if (!oppResult.ok) {
      setError(oppResult.error.message);
      setOpp(null);
      return;
    }
    if (pipelinesResult.ok) {
      setPipelines(pipelinesResult.data);
    }
    setError(null);
    setOpp(oppResult.data);
    setTitle(oppResult.data.title);
    setValue(String(oppResult.data.value ?? 0));
    setStageId(oppResult.data.stageId);
    setStatus(oppResult.data.status);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const stages = useMemo(() => {
    if (!opp) return [];
    const p = pipelines.find((x) => x.id === opp.pipelineId);
    return [...(p?.stages ?? [])].sort((a, b) => a.order - b.order);
  }, [pipelines, opp]);

  const stageName = stages.find((s) => s.id === (editing ? stageId : opp?.stageId))?.name;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!opp) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    const parsed = Number(value);
    setBusy(true);
    const result = await apiFetch<OpportunityRow>(`/opportunities/${opp.id}`, {
      method: 'PATCH',
      body: {
        title: trimmed,
        value: Number.isFinite(parsed) ? parsed : 0,
        stageId,
        status,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setOpp(result.data);
    setEditing(false);
    setError(null);
  }

  async function markStatus(next: 'WON' | 'LOST') {
    if (!opp) return;
    setBusy(true);
    const path = next === 'WON' ? 'won' : 'lost';
    const result = await apiFetch<OpportunityRow>(`/opportunities/${opp.id}/${path}`, {
      method: 'POST',
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setOpp(result.data);
    setStatus(result.data.status);
    setError(null);
  }

  if (!opp && !error) {
    return (
      <>
        <PageHeader eyebrow="CRM" title="Oportunidade" description="Carregando\u2026" />
        <LoadingState />
      </>
    );
  }

  if (error || !opp) {
    return (
      <>
        <PageHeader
          eyebrow="CRM"
          title="Oportunidade"
          description="Detalhe"
          action={
            <Link href="/oportunidades" className="btn-ghost">
              Voltar
            </Link>
          }
        />
        <ErrorState message={error ?? 'Nao encontrado'} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title={opp.title}
        description={`Atualizado ${formatDate(opp.updatedAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/oportunidades" className="btn-ghost">
              Voltar
            </Link>
            <Link href="/funil" className="btn-ghost">
              Funil
            </Link>
            <button
              type="button"
              className="btn-ghost"
              disabled={busy}
              onClick={() => {
                if (editing) {
                  setTitle(opp.title);
                  setValue(String(opp.value ?? 0));
                  setStageId(opp.stageId);
                  setStatus(opp.status);
                }
                setEditing((v) => !v);
              }}
            >
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          </div>
        }
      />
      {error ? (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      ) : null}
      <div className="card-panel space-y-4 p-4 sm:p-6">
        {editing ? (
          <form className="space-y-4" onSubmit={save}>
            <label className="block text-sm text-smoke">
              {'T\u00edtulo'}
              <input
                className="input-field mt-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm text-smoke">
              Valor
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field mt-1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
            <label className="block text-sm text-smoke">
              {'Est\u00e1gio'}
              <select
                className="input-field mt-1"
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-smoke">
              Status
              <select
                className="input-field mt-1"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn-primary" disabled={busy || !title.trim()}>
              {busy ? 'Salvando\u2026' : 'Salvar'}
            </button>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={opp.status} tone={statusTone(opp.status)} />
              <span className="text-sm text-smoke">{formatMoney(opp.value)}</span>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-faint">{'Est\u00e1gio'}</dt>
                <dd className="text-bone">{stageName ?? opp.stageId}</dd>
              </div>
              <div>
                <dt className="text-faint">Criado</dt>
                <dd className="text-bone">{formatDate(opp.createdAt)}</dd>
              </div>
            </dl>
            {opp.status === 'OPEN' ? (
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => void markStatus('WON')}
                >
                  Marcar ganha
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={busy}
                  onClick={() => void markStatus('LOST')}
                >
                  Marcar perdida
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
