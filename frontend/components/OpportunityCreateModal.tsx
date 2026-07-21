'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';

export type PipelineStageOption = { id: string; name: string; order: number };
export type PipelineOption = {
  id: string;
  name: string;
  isDefault: boolean;
  stages: PipelineStageOption[];
};

type OpportunityCreateModalProps = {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: { title: string; pipelineId: string; stageId: string; value?: number }) => void;
};

export function OpportunityCreateModal({
  open,
  busy,
  onClose,
  onSubmit,
}: OpportunityCreateModalProps) {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [pipelines, setPipelines] = useState<PipelineOption[]>([]);
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const result = await apiFetch<PipelineOption[]>('/pipelines');
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(result.error.message);
        setPipelines([]);
        return;
      }
      setLoadError(null);
      const list = result.data;
      setPipelines(list);
      const preferred = list.find((p) => p.isDefault) ?? list[0];
      if (preferred) {
        setPipelineId(preferred.id);
        const firstStage = [...(preferred.stages ?? [])].sort((a, b) => a.order - b.order)[0];
        setStageId(firstStage?.id ?? '');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const stages = useMemo(() => {
    const p = pipelines.find((x) => x.id === pipelineId);
    return [...(p?.stages ?? [])].sort((a, b) => a.order - b.order);
  }, [pipelines, pipelineId]);

  if (!open) return null;

  function handlePipelineChange(nextId: string) {
    setPipelineId(nextId);
    const p = pipelines.find((x) => x.id === nextId);
    const first = [...(p?.stages ?? [])].sort((a, b) => a.order - b.order)[0];
    setStageId(first?.id ?? '');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !pipelineId || !stageId) return;
    const parsed = value.trim() === '' ? undefined : Number(value);
    onSubmit({
      title: trimmed,
      pipelineId,
      stageId,
      value: parsed != null && Number.isFinite(parsed) ? parsed : undefined,
    });
  }

  const canSubmit = Boolean(title.trim() && pipelineId && stageId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="opportunity-create-title"
        className="relative z-10 w-full max-w-md rounded-t-lg border border-line bg-panel p-4 shadow-elevated sm:rounded-lg sm:p-6"
      >
        <h2 id="opportunity-create-title" className="font-display text-lg text-bone">
          Nova oportunidade
        </h2>
        {loadError ? <p className="mt-2 text-sm text-ember">{loadError}</p> : null}
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-smoke">
            {'T\u00edtulo'}
            <input
              className="input-field mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
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
              placeholder="0"
            />
          </label>
          <label className="block text-sm text-smoke">
            Pipeline
            <select
              className="input-field mt-1"
              value={pipelineId}
              onChange={(e) => handlePipelineChange(e.target.value)}
              required
            >
              {pipelines.length === 0 ? <option value="">Carregando\u2026</option> : null}
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.isDefault ? ' (padrao)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-smoke">
            {'Est\u00e1gio'}
            <select
              className="input-field mt-1"
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              required
            >
              {stages.length === 0 ? <option value="">Sem estagios</option> : null}
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={busy || !canSubmit}>
              {busy ? 'Salvando\u2026' : 'Criar oportunidade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
