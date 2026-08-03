'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { apiDownloadText, apiFetch } from '@/lib/api';

type PeriodQuery = { from: string; to: string };

type PipelineReport = {
  data: Array<{
    stageId: string;
    stageName: string;
    stageOrder: number;
    count: number;
    amountSum: number;
  }>;
  meta: { from: string; to: string; pipelineId?: string };
};

type LeadConversionReport = {
  data: { createdCount: number; convertedCount: number; conversionRate: number };
  meta: { from: string; to: string; definition: string };
};

type RevenueReport = {
  data: { forecast: number; realized: number };
  meta: { from: string; to: string };
};

type SlaReport = {
  data: {
    conversationsOpen: number;
    conversationsTotal: number;
    opportunitiesSlaBreached: number;
  };
  meta: { from: string; to: string; partial: boolean; partialReason?: string };
};

function defaultPeriod(): PeriodQuery {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function fromDateInputValue(date: string, endOfDay: boolean): string {
  if (!date) return new Date().toISOString();
  const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
  return `${date}${suffix}`;
}

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPct(rate: number): string {
  return `${(rate * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function downloadBlob(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function queryString(period: PeriodQuery): string {
  const params = new URLSearchParams({ from: period.from, to: period.to });
  return params.toString();
}

export function RelatoriosClient() {
  const [period, setPeriod] = useState<PeriodQuery>(() => defaultPeriod());
  const [pipeline, setPipeline] = useState<PipelineReport | null>(null);
  const [conversion, setConversion] = useState<LeadConversionReport | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [sla, setSla] = useState<SlaReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const qs = useMemo(() => queryString(period), [period]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [p, c, r, s] = await Promise.all([
      apiFetch<PipelineReport>(`/reports/pipeline?${qs}`),
      apiFetch<LeadConversionReport>(`/reports/lead-conversion?${qs}`),
      apiFetch<RevenueReport>(`/reports/revenue?${qs}`),
      apiFetch<SlaReport>(`/reports/sla?${qs}`),
    ]);
    if (!p.ok || !c.ok || !r.ok || !s.ok) {
      const msg =
        (!p.ok && p.error.message) ||
        (!c.ok && c.error.message) ||
        (!r.ok && r.error.message) ||
        (!s.ok && s.error.message) ||
        'Falha ao carregar relatórios';
      setError(msg);
      setPipeline(null);
      setConversion(null);
      setRevenue(null);
      setSla(null);
      setLoading(false);
      return;
    }
    setPipeline(p.data);
    setConversion(c.data);
    setRevenue(r.data);
    setSla(s.data);
    setLoading(false);
  }, [qs]);

  useEffect(() => {
    void load();
  }, [load]);

  async function exportKind(kind: string) {
    setExporting(kind);
    const result = await apiDownloadText(`/reports/${kind}/export.csv?${qs}`);
    setExporting(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    downloadBlob(`report-${kind}.csv`, result.data);
  }

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Relatórios"
        description="Métricas comerciais do tenant — pipeline, conversão, receita e SLA."
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-mist">
          De
          <input
            type="date"
            className="rounded border border-line bg-ink px-3 py-2 text-bone"
            value={toDateInputValue(period.from)}
            onChange={(e) =>
              setPeriod((prev) => ({
                ...prev,
                from: fromDateInputValue(e.target.value, false),
              }))
            }
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-mist">
          Até
          <input
            type="date"
            className="rounded border border-line bg-ink px-3 py-2 text-bone"
            value={toDateInputValue(period.to)}
            onChange={(e) =>
              setPeriod((prev) => ({
                ...prev,
                to: fromDateInputValue(e.target.value, true),
              }))
            }
          />
        </label>
        <button
          type="button"
          className="btn-primary"
          onClick={() => void load()}
          disabled={loading}
        >
          Atualizar
        </button>
      </div>

      {loading ? <LoadingState label="Carregando relatórios…" /> : null}
      {error ? (
        <ErrorState title="Erro nos relatórios" message={error} onRetry={() => void load()} />
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card-panel">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-display text-bone">Pipeline por estágio</h3>
              <button
                type="button"
                className="btn-ghost text-sm"
                disabled={exporting === 'pipeline'}
                onClick={() => void exportKind('pipeline')}
              >
                CSV
              </button>
            </div>
            {!pipeline?.data.length ? (
              <p className="text-sm text-smoke">Nenhuma oportunidade aberta no período.</p>
            ) : (
              <ul className="space-y-2 text-sm text-mist">
                {pipeline.data.map((row) => (
                  <li
                    key={row.stageId}
                    className="flex justify-between gap-2 border-b border-line/40 pb-2"
                  >
                    <span className="text-bone">{row.stageName}</span>
                    <span>
                      {row.count} · {formatMoney(row.amountSum)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card-panel">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-display text-bone">Conversão de leads</h3>
              <button
                type="button"
                className="btn-ghost text-sm"
                disabled={exporting === 'lead-conversion'}
                onClick={() => void exportKind('lead-conversion')}
              >
                CSV
              </button>
            </div>
            {!conversion || conversion.data.createdCount === 0 ? (
              <p className="text-sm text-smoke">Nenhum lead criado no período.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-mist">Criados</dt>
                  <dd className="text-lg text-bone">{conversion.data.createdCount}</dd>
                </div>
                <div>
                  <dt className="text-mist">Convertidos</dt>
                  <dd className="text-lg text-bone">{conversion.data.convertedCount}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-mist">Taxa</dt>
                  <dd className="text-lg text-bone">{formatPct(conversion.data.conversionRate)}</dd>
                </div>
              </dl>
            )}
          </div>

          <div className="card-panel">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-display text-bone">Receita prevista vs. realizada</h3>
              <button
                type="button"
                className="btn-ghost text-sm"
                disabled={exporting === 'revenue'}
                onClick={() => void exportKind('revenue')}
              >
                CSV
              </button>
            </div>
            {!revenue || (revenue.data.forecast === 0 && revenue.data.realized === 0) ? (
              <p className="text-sm text-smoke">Sem valores de oportunidade no período.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-mist">Prevista (OPEN)</dt>
                  <dd className="text-lg text-bone">{formatMoney(revenue.data.forecast)}</dd>
                </div>
                <div>
                  <dt className="text-mist">Realizada (WON)</dt>
                  <dd className="text-lg text-bone">{formatMoney(revenue.data.realized)}</dd>
                </div>
              </dl>
            )}
          </div>

          <div className="card-panel">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-display text-bone">SLA de atendimento</h3>
              <button
                type="button"
                className="btn-ghost text-sm"
                disabled={exporting === 'sla'}
                onClick={() => void exportKind('sla')}
              >
                CSV
              </button>
            </div>
            {!sla ? (
              <p className="text-sm text-smoke">Indicadores SLA indisponíveis.</p>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-mist">Conversas abertas</dt>
                    <dd className="text-lg text-bone">{sla.data.conversationsOpen}</dd>
                  </div>
                  <div>
                    <dt className="text-mist">Conversas no período</dt>
                    <dd className="text-lg text-bone">{sla.data.conversationsTotal}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-mist">Oportunidades com SLA violado</dt>
                    <dd className="text-lg text-bone">{sla.data.opportunitiesSlaBreached}</dd>
                  </div>
                </dl>
                {sla.meta.partial ? (
                  <p className="mt-3 text-xs text-mist">
                    Dados parciais: first-response ainda não modelado no CRM.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
