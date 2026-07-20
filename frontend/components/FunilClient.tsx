'use client';

import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
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

function isSlaWarning(deal: Opportunity): boolean {
  if (deal.status !== 'OPEN') return false;
  if (deal.slaBreachedAt) return true;
  if (!deal.stageEnteredAt) return false;
  const entered = new Date(deal.stageEnteredAt).getTime();
  if (Number.isNaN(entered)) return false;
  return Date.now() - entered >= SLA_HOURS * 60 * 60 * 1000;
}

const FALLBACK_COLUMNS = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado'];

export function FunilClient() {
  const [columns, setColumns] = useState<{ key: string; label: string }[] | null>(null);
  const [stageOrder, setStageOrder] = useState<string[]>([]);
  const [byStage, setByStage] = useState<Record<string, Opportunity[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  if (columns === null && !error) {
    return (
      <>
        <PageHeader
          title="Funil"
          description="Kanban de oportunidades — mover estágio, ganhar ou perder."
        />
        <LoadingState />
      </>
    );
  }

  if (error && !columns) {
    return (
      <>
        <PageHeader title="Funil" description="Kanban de oportunidades." />
        <ErrorState message={error} />
      </>
    );
  }

  const cols = columns ?? FALLBACK_COLUMNS.map((label) => ({ key: label, label }));

  return (
    <>
      <PageHeader
        title="Funil"
        description="Kanban de oportunidades — mover estágio, ganhar ou perder."
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
          return (
            <div
              key={column.key}
              className="kanban-column card-panel min-h-[240px] lg:w-auto lg:min-h-[280px]"
            >
              <h3 className="font-display text-sm text-bone">{column.label}</h3>
              <div className="mt-4 space-y-2">
                {deals.length === 0 ? (
                  <EmptyState
                    title="Vazio"
                    description={`Nenhum deal em ${column.label.toLowerCase()}.`}
                  />
                ) : (
                  deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="border-t border-line pt-2 text-sm text-bone first:border-t-0 first:pt-0"
                    >
                      <p className="break-words">{deal.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {deal.status}
                        {isSlaWarning(deal) ? (
                          <span className="ml-2 text-amber-400" title="SLA de estágio (>24h)">
                            SLA
                          </span>
                        ) : null}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {prev ? (
                          <button
                            type="button"
                            className="btn-primary text-xs"
                            disabled={busyId === deal.id}
                            onClick={() => void move(deal.id, prev)}
                          >
                            ←
                          </button>
                        ) : null}
                        {next ? (
                          <button
                            type="button"
                            className="btn-primary text-xs"
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
                              className="btn-primary text-xs"
                              disabled={busyId === deal.id}
                              onClick={() => void mark(deal.id, 'won')}
                            >
                              Ganho
                            </button>
                            <button
                              type="button"
                              className="btn-primary text-xs"
                              disabled={busyId === deal.id}
                              onClick={() => void mark(deal.id, 'lost')}
                            >
                              Perdido
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-faint lg:hidden">
        Deslize horizontalmente para ver os estágios.
      </p>
    </>
  );
}
