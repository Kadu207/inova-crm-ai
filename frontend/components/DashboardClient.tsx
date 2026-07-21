'use client';

import { useEffect, useState } from 'react';
import { ErrorState } from '@/components/ErrorState';
import { KpiStat } from '@/components/KpiStat';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { apiFetch, getApiBaseUrl } from '@/lib/api';

type DashboardSummary = {
  leadsActive: number;
  opportunitiesOpen: number;
  conversationsOpen: number;
  pipelineValue: number;
};

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function DashboardClient() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await apiFetch<DashboardSummary>('/dashboard/summary');
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error.message);
        setSummary(null);
        return;
      }
      setError(null);
      setSummary(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Principal"
        title="Dashboard"
        description={`Visão geral do tenant — API: ${getApiBaseUrl()}`}
      />
      {summary === null && !error ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiStat
              label="Leads ativos"
              value={String(summary.leadsActive)}
              hint="exceto convertidos / perdidos"
              accent
            />
            <KpiStat
              label="Oportunidades abertas"
              value={String(summary.opportunitiesOpen)}
              hint="status OPEN"
            />
            <KpiStat
              label="Conversas abertas"
              value={String(summary.conversationsOpen)}
              hint="OPEN + PENDING"
            />
            <KpiStat
              label="Receita prevista"
              value={formatMoney(summary.pipelineValue)}
              hint="soma do funil aberto"
            />
          </div>
          <section className="mt-6 card-panel">
            <h2 className="font-display text-lg text-bone">Atividade recente</h2>
            <p className="mt-2 text-sm text-smoke">
              Eventos de domínio (leads, conversas, estágio) aparecerão aqui na próxima iteração de
              timeline.
            </p>
          </section>
        </>
      ) : null}
    </>
  );
}
