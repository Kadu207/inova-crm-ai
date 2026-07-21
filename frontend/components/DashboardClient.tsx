'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { KpiStat } from '@/components/KpiStat';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiFetch, getApiBaseUrl } from '@/lib/api';

type DashboardSummary = {
  leadsActive: number;
  opportunitiesOpen: number;
  conversationsOpen: number;
  pipelineValue: number;
};

type ActivityItem = {
  id: string;
  kind: 'lead' | 'opportunity' | 'conversation' | 'company' | 'contact';
  label: string;
  href: string;
  occurredAt: string;
};

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function kindLabel(kind: ActivityItem['kind']): string {
  switch (kind) {
    case 'lead':
      return 'Lead';
    case 'opportunity':
      return 'Oportunidade';
    case 'conversation':
      return 'Conversa';
    case 'company':
      return 'Empresa';
    case 'contact':
      return 'Contato';
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function kindTone(kind: ActivityItem['kind']): 'ok' | 'warn' | 'bad' | 'neutral' | 'flame' {
  switch (kind) {
    case 'lead':
      return 'flame';
    case 'opportunity':
      return 'ok';
    case 'conversation':
      return 'warn';
    case 'company':
    case 'contact':
      return 'neutral';
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function DashboardClient() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [summaryResult, activityResult] = await Promise.all([
        apiFetch<DashboardSummary>('/dashboard/summary'),
        apiFetch<ActivityItem[]>('/dashboard/activity?limit=20'),
      ]);
      if (cancelled) return;
      if (!summaryResult.ok) {
        setError(summaryResult.error.message);
        setSummary(null);
        setActivity([]);
        return;
      }
      setError(null);
      setSummary(summaryResult.data);
      if (activityResult.ok) {
        setActivity(activityResult.data);
      } else {
        setActivity([]);
      }
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
        description={`Vis\u00e3o geral do tenant \u2014 API: ${getApiBaseUrl()}`}
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
            {activity === null ? (
              <p className="mt-2 text-sm text-smoke">Carregando…</p>
            ) : activity.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Sem atividade"
                  description="Crie leads, empresas ou contatos para ver o hist\u00f3rico aqui."
                />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {activity.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={kindLabel(item.kind)} tone={kindTone(item.kind)} />
                        <Link
                          href={item.href}
                          className="truncate font-medium text-bone hover:text-flame"
                        >
                          {item.label}
                        </Link>
                      </div>
                      <p className="mt-1 text-xs text-faint">{formatDate(item.occurredAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
