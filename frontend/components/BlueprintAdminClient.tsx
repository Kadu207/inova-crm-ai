'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Stage = { id: string; name: string; order: number };
type Pipeline = { id: string; name: string; isDefault: boolean; stages: Stage[] };
type Transition = {
  id: string;
  fromStageId: string;
  toStageId: string;
  requiredFieldKeys: string[];
};

const REQUIRED_OPTIONS = [
  'title',
  'value',
  'contactId',
  'assignedToId',
  'expectedCloseDate',
  'leadId',
] as const;

export function BlueprintAdminClient() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [pipelineId, setPipelineId] = useState('');
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [fromStageId, setFromStageId] = useState('');
  const [toStageId, setToStageId] = useState('');
  const [required, setRequired] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const stages = pipelines.find((p) => p.id === pipelineId)?.stages ?? [];

  const loadPipelines = useCallback(async () => {
    const result = await apiFetch<Pipeline[]>('/pipelines');
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setPipelines(result.data);
    const def = result.data.find((p) => p.isDefault) ?? result.data[0];
    if (def) setPipelineId(def.id);
  }, []);

  const loadTransitions = useCallback(async (id: string) => {
    if (!id) return;
    const result = await apiFetch<Transition[]>(`/pipelines/${id}/blueprint/transitions`);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setError(null);
    setTransitions(result.data);
  }, []);

  useEffect(() => {
    void loadPipelines();
  }, [loadPipelines]);

  useEffect(() => {
    if (pipelineId) void loadTransitions(pipelineId);
  }, [pipelineId, loadTransitions]);

  function stageName(id: string): string {
    return stages.find((s) => s.id === id)?.name ?? id;
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!pipelineId || !fromStageId || !toStageId) return;
    setBusy(true);
    const result = await apiFetch<Transition>(`/pipelines/${pipelineId}/blueprint/transitions`, {
      method: 'POST',
      body: { fromStageId, toStageId, requiredFieldKeys: required },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setFromStageId('');
    setToStageId('');
    setRequired([]);
    await loadTransitions(pipelineId);
  }

  async function onDelete(transitionId: string) {
    if (!pipelineId) return;
    setBusy(true);
    const result = await apiFetch(
      `/pipelines/${pipelineId}/blueprint/transitions/${transitionId}`,
      {
        method: 'DELETE',
      },
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await loadTransitions(pipelineId);
  }

  function toggleRequired(key: string) {
    setRequired((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  return (
    <section className="card-panel space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-bone">Blueprint do funil</h2>
        <p className="mt-1 text-sm text-smoke">
          Sem transições = movimento livre. Com ≥1 regra, só arestas permitidas valem.
        </p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <label className="block text-sm text-smoke">
        Pipeline
        <select
          className="mt-1 w-full rounded border border-line bg-void px-3 py-2 text-bone"
          value={pipelineId}
          onChange={(e) => setPipelineId(e.target.value)}
        >
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.isDefault ? ' (default)' : ''}
            </option>
          ))}
        </select>
      </label>

      <ul className="divide-y divide-line">
        {transitions.length === 0 ? (
          <li className="py-3 text-sm text-smoke">Nenhuma transição — modo legado ativo.</li>
        ) : (
          transitions.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span className="text-sm text-bone">
                {stageName(t.fromStageId)} → {stageName(t.toStageId)}
                {t.requiredFieldKeys.length > 0 ? ` · req: ${t.requiredFieldKeys.join(', ')}` : ''}
              </span>
              <button
                type="button"
                className="btn-ghost text-sm"
                disabled={busy}
                onClick={() => void onDelete(t.id)}
              >
                Remover
              </button>
            </li>
          ))
        )}
      </ul>

      <form className="space-y-3 border-t border-line pt-4" onSubmit={onCreate}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-smoke">
            De
            <select
              className="mt-1 w-full rounded border border-line bg-void px-3 py-2 text-bone"
              value={fromStageId}
              onChange={(e) => setFromStageId(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-smoke">
            Para
            <select
              className="mt-1 w-full rounded border border-line bg-void px-3 py-2 text-bone"
              value={toStageId}
              onChange={(e) => setToStageId(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset>
          <legend className="text-sm text-smoke">Campos obrigatórios na transição</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {REQUIRED_OPTIONS.map((key) => (
              <label key={key} className="flex items-center gap-1 text-xs text-bone">
                <input
                  type="checkbox"
                  checked={required.includes(key)}
                  onChange={() => toggleRequired(key)}
                />
                {key}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn-primary" disabled={busy || !pipelineId}>
          Adicionar transição
        </button>
      </form>
    </section>
  );
}
