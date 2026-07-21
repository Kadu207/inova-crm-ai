'use client';

import { DragEvent, useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiFetch, fetchListStub } from '@/lib/api';

type Stage = { id: string; name: string; order: number };
type Pipeline = { id: string; name: string; isDefault: boolean; stages: Stage[] };
type Opportunity = {
  id: string;
  title: string;
  stageId: string;
  status: string;
  value: string | number;
  stageEnteredAt?: string;
  slaBreachedAt?: string | null;
};

const SLA_HOURS = 24;
const DRAG_TYPE = 'application/x-inova-opportunity-id';

function isSlaWarning(deal: Opportunity): boolean {
  if (deal.status !== 'OPEN') return false;
  if (deal.slaBreachedAt) return true;
  if (!deal.stageEnteredAt) return false;
  const entered = new Date(deal.stageEnteredAt).getTime();
  if (Number.isNaN(entered)) return false;
  return Date.now() - entered >= SLA_HOURS * 60 * 60 * 1000;
}

function formatValue(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const FALLBACK_COLUMNS = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado'];

export function FunilClient() {
  const [columns, setColumns] = useState<{ key: string; label: string }[] | null>(null);
  const [stageOrder, setStageOrder] = useState<string[]>([]);
  const [byStage, setByStage] = useState<Record<string, Opportunity[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [pipelinesResult, oppsResult] = await Promise.all([
      apiFetch<Pipeline[]>('/pipelines'),
      fetchListStub<Opportunity>('opportunities'),
    ]);

    if (!pipelinesResult.ok) {
      setError(pipelinesResult.error.message);
      setColumns(FALLBACK_COLUMNS.map((label) => ({ key: label, label })));
      return;
    }
    if (!oppsResult.ok) {
      setError(oppsResult.error.message);
      setColumns(FALLBACK_COLUMNS.map((label) => ({ key: label, label })));
      return;
    }

    const pipelines = pipelinesResult.data;
    const defaultPipeline = pipelines.find((p) => p.isDefault) ?? pipelines[0] ?? null;
    const stages = defaultPipeline?.stages ?? [];

    const cols =
      stages.length > 0
        ? stages.map((s) => ({ key: s.id, label: s.name }))
        : FALLBACK_COLUMNS.map((label) => ({ key: label, label }));

    const grouped: Record<string, Opportunity[]> = {};
    for (const col of cols) grouped[col.key] = [];
    for (const opp of oppsResult.data) {
      if (opp.status === 'LOST') continue;
      const key = opp.stageId in grouped ? opp.stageId : cols[0]?.key;
      if (key) grouped[key] = [...(grouped[key] ?? []), opp];
    }

    setError(null);
    setColumns(cols);
    setStageOrder(cols.map((c) => c.key));
    setByStage(grouped);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function move(oppId: string, stageId: string) {
    setBusyId(oppId);
    const result = await apiFetch(`/opportunities/${oppId}/move`, {
      method: 'POST',
      body: { stageId },
    });
    setBusyId(null);
    setDropTarget(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await load();
  }

  async function mark(oppId: string, outcome: 'won' | 'lost') {
    setBusyId(oppId);
    const result = await apiFetch(`/opportunities/${oppId}/${outcome}`, { method: 'POST' });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await load();
  }

  function onDragStart(e: DragEvent, oppId: string) {
    e.dataTransfer.setData(DRAG_TYPE, oppId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e: DragEvent, stageId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(stageId);
  }

  function onDragLeave(stageId: string) {
    setDropTarget((current) => (current === stageId ? null : current));
  }

  function onDrop(e: DragEvent, stageId: string) {
    e.preventDefault();
    const oppId = e.dataTransfer.getData(DRAG_TYPE);
    setDropTarget(null);
    if (!oppId) return;
    const currentStage = Object.entries(byStage).find(([, deals]) =>
      deals.some((d) => d.id === oppId),
    )?.[0];
    if (currentStage === stageId) return;
    void move(oppId, stageId);
  }

  if (columns === null && !error) {
    return (
      <>
        <PageHeader
          eyebrow="CRM"
          title="Funil"
          description="Kanban de oportunidades — arraste cards ou use os botões."
        />
        <LoadingState />
      </>
    );
  }

  if (error && !columns) {
    return (
      <>
        <PageHeader eyebrow="CRM" title="Funil" description="Kanban de oportunidades." />
        <ErrorState message={error} />
      </>
    );
  }

  const cols = columns ?? FALLBACK_COLUMNS.map((label) => ({ key: label, label }));

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Funil"
        description="Kanban de oportunidades — arraste cards entre colunas (desktop) ou use ←/→."
        action={<button className="btn-primary">+ Oportunidade</button>}
      />
      {error ? (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      ) : null}
      <div className="kanban-board lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0 lg:snap-none">
        {cols.map((column, colIdx) => {
          const deals = byStage[column.key] ?? [];
          const prev = stageOrder[colIdx - 1];
          const next = stageOrder[colIdx + 1];
          const columnValue = deals.reduce((sum, d) => {
            const n = typeof d.value === 'number' ? d.value : Number(d.value);
            return sum + (Number.isFinite(n) ? n : 0);
          }, 0);
          const isTarget = dropTarget === column.key;

          return (
            <section
              key={column.key}
              onDragOver={(e) => onDragOver(e, column.key)}
              onDragLeave={() => onDragLeave(column.key)}
              onDrop={(e) => onDrop(e, column.key)}
              className={[
                'kanban-column card-panel flex min-h-[240px] flex-col transition-colors lg:w-auto lg:min-h-[280px]',
                isTarget ? 'border-flame ring-1 ring-flame' : '',
              ].join(' ')}
            >
              <header className="sticky top-0 z-10 -mx-1 border-b border-line bg-panel px-1 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-sm text-bone">{column.label}</h3>
                  <StatusBadge label={String(deals.length)} tone="neutral" />
                </div>
                <p className="mt-1 font-display text-sm text-flame">{formatValue(columnValue)}</p>
              </header>
              <div className="mt-4 flex-1 space-y-2">
                {deals.length === 0 ? (
                  <EmptyState
                    title="Vazio"
                    description={`Nenhum deal em ${column.label.toLowerCase()}.`}
                  />
                ) : (
                  deals.map((deal) => (
                    <article
                      key={deal.id}
                      draggable={deal.status === 'OPEN'}
                      onDragStart={(e) => onDragStart(e, deal.id)}
                      className={[
                        'deal-card',
                        deal.status === 'OPEN' ? 'cursor-grab active:cursor-grabbing' : '',
                      ].join(' ')}
                    >
                      <p className="break-words text-sm font-medium text-bone">{deal.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge
                          label={deal.status}
                          tone={deal.status === 'WON' ? 'ok' : 'neutral'}
                        />
                        {isSlaWarning(deal) ? <StatusBadge label="SLA" tone="warn" /> : null}
                        <span className="text-xs text-flame">{formatValue(deal.value)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {prev ? (
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1 text-xs"
                            disabled={busyId === deal.id}
                            onClick={() => void move(deal.id, prev)}
                          >
                            ←
                          </button>
                        ) : null}
                        {next ? (
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1 text-xs"
                            disabled={busyId === deal.id}
                            onClick={() => void move(deal.id, next)}
                          >
                            →
                          </button>
                        ) : null}
                        {deal.status === 'OPEN' ? (
                          <>
                            <button
                              type="button"
                              className="btn-primary px-2 py-1 text-xs"
                              disabled={busyId === deal.id}
                              onClick={() => void mark(deal.id, 'won')}
                            >
                              Ganho
                            </button>
                            <button
                              type="button"
                              className="btn-ghost px-2 py-1 text-xs"
                              disabled={busyId === deal.id}
                              onClick={() => void mark(deal.id, 'lost')}
                            >
                              Perdido
                            </button>
                          </>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-faint lg:hidden">
        Deslize horizontalmente. Em telas touch use os botões ←/→.
      </p>
    </>
  );
}
