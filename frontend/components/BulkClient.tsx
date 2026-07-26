'use client';

import { FormEvent, useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiDownloadText, apiFetch } from '@/lib/api';

type BulkModule = 'leads' | 'contacts' | 'companies';
type BulkJob = {
  id: string;
  type: 'EXPORT' | 'IMPORT';
  module: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  fileKey?: string | null;
  rowCount?: number | null;
  error?: string | null;
  createdAt: string;
};

function jobTone(status: BulkJob['status']): 'ok' | 'warn' | 'bad' | 'neutral' {
  switch (status) {
    case 'DONE':
      return 'ok';
    case 'RUNNING':
    case 'PENDING':
      return 'warn';
    case 'FAILED':
      return 'bad';
    default:
      return 'neutral';
  }
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

export function BulkClient() {
  const [jobs, setJobs] = useState<BulkJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exportModule, setExportModule] = useState<BulkModule>('leads');
  const [importModule, setImportModule] = useState<'leads' | 'contacts'>('leads');
  const [csv, setCsv] = useState('title,notes\nLead exemplo,via UI bulk\n');

  async function load() {
    const result = await apiFetch<BulkJob[]>('/bulk/jobs');
    if (!result.ok) {
      setError(result.error.message);
      setJobs([]);
      return;
    }
    setError(null);
    setJobs(result.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function startExport() {
    setBusy(true);
    const result = await apiFetch<BulkJob>('/bulk/export', {
      method: 'POST',
      body: { module: exportModule },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await load();
  }

  async function startImport(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const result = await apiFetch<BulkJob>('/bulk/import', {
      method: 'POST',
      body: { module: importModule, csv },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await load();
  }

  async function downloadJob(job: BulkJob) {
    if (job.type !== 'EXPORT' || job.status !== 'DONE') return;
    setBusy(true);
    const result = await apiDownloadText(`/bulk/jobs/${job.id}/download`);
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    downloadBlob(`${job.module}-${job.id}.csv`, result.data);
  }

  if (jobs === null && !error) {
    return (
      <>
        <PageHeader
          eyebrow="Sistema"
          title="Import / Export"
          description="Bulk CSV (MinIO) — leads, contacts e companies."
        />
        <LoadingState />
      </>
    );
  }

  const rows = jobs ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Import / Export"
        description="Bulk CSV no MinIO — export/import por modulo do tenant."
      />

      {error ? (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel p-4">
          <h2 className="mb-3 text-sm font-medium text-bone">Exportar CSV</h2>
          <label className="block text-xs text-faint">
            Modulo
            <select
              className="input-field mt-1"
              value={exportModule}
              onChange={(e) => setExportModule(e.target.value as BulkModule)}
            >
              <option value="leads">leads</option>
              <option value="contacts">contacts</option>
              <option value="companies">companies</option>
            </select>
          </label>
          <button
            type="button"
            className="btn-primary mt-3"
            disabled={busy}
            onClick={() => void startExport()}
          >
            {busy ? 'Processando…' : 'Iniciar export'}
          </button>
        </div>

        <form className="rounded-lg border border-line bg-panel p-4" onSubmit={startImport}>
          <h2 className="mb-3 text-sm font-medium text-bone">Importar CSV</h2>
          <label className="block text-xs text-faint">
            Modulo
            <select
              className="input-field mt-1"
              value={importModule}
              onChange={(e) => setImportModule(e.target.value as 'leads' | 'contacts')}
            >
              <option value="leads">leads (coluna title)</option>
              <option value="contacts">contacts (coluna name)</option>
            </select>
          </label>
          <label className="mt-3 block text-xs text-faint">
            CSV
            <textarea
              className="input-field mt-1 min-h-28 font-mono text-xs"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn-primary mt-3" disabled={busy}>
            {busy ? 'Processando…' : 'Importar'}
          </button>
        </form>
      </div>

      <h2 className="mb-2 text-sm font-medium text-bone">Jobs recentes</h2>
      {rows.length === 0 ? (
        <EmptyState title="Nenhum job" description="Exporte ou importe um CSV para comecar." />
      ) : (
        <div className="card-panel table-scroll overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-faint">
                <th className="pb-3 pr-4 font-medium">Tipo</th>
                <th className="pb-3 pr-4 font-medium">Modulo</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Linhas</th>
                <th className="pb-3 pr-4 font-medium">Criado</th>
                <th className="pb-3 font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((job) => (
                <tr key={job.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4 text-smoke">{job.type}</td>
                  <td className="py-3 pr-4 text-bone">{job.module}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge label={job.status} tone={jobTone(job.status)} />
                    {job.error ? (
                      <p className="mt-1 max-w-xs truncate text-xs text-bad" title={job.error}>
                        {job.error}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4 text-smoke">{job.rowCount ?? '—'}</td>
                  <td className="py-3 pr-4 text-xs text-faint">
                    {new Date(job.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3">
                    {job.type === 'EXPORT' && job.status === 'DONE' ? (
                      <button
                        type="button"
                        className="btn-ghost text-xs"
                        disabled={busy}
                        onClick={() => void downloadJob(job)}
                      >
                        Download
                      </button>
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
