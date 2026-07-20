'use client';

import { useEffect, useState } from 'react';
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
};

const FALLBACK_COLUMNS = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado'];

export function FunilClient() {
  const [columns, setColumns] = useState<{ key: string; label: string }[] | null>(null);
  const [byStage, setByStage] = useState<Record<string, Opportunity[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [pipelinesResult, oppsResult] = await Promise.all([
        apiFetch<Pipeline[]>('/pipelines'),
        fetchListStub<Opportunity>('opportunities'),
      ]);

      if (cancelled) return;

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
        const key = opp.stageId in grouped ? opp.stageId : cols[0]?.key;
        if (key) grouped[key] = [...(grouped[key] ?? []), opp];
      }

      setError(null);
      setColumns(cols);
      setByStage(grouped);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (columns === null && !error) {
    return (
      <>
        <PageHeader
          title="Funil"
          description="Kanban de oportunidades por estágio — dados via API pipeline."
        />
        <LoadingState />
      </>
    );
  }

  if (error && !columns) {
    return (
      <>
        <PageHeader
          title="Funil"
          description="Kanban de oportunidades por estágio — dados via API pipeline."
        />
        <ErrorState message={error} />
      </>
    );
  }

  const cols = columns ?? FALLBACK_COLUMNS.map((label) => ({ key: label, label }));

  return (
    <>
      <PageHeader
        title="Funil"
        description="Kanban de oportunidades por estágio — dados via API pipeline."
        action={<button className="btn-primary">Nova oportunidade</button>}
      />
      {error ? (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      ) : null}
      <div className="kanban-board lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0 lg:snap-none">
        {cols.map((column) => {
          const deals = byStage[column.key] ?? [];
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
                      <p className="mt-1 text-xs text-muted">{deal.status}</p>
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
