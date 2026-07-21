'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { EntityCard } from '@/components/EntityCard';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { TaskCreateModal } from '@/components/TaskCreateModal';
import { apiFetch } from '@/lib/api';

export type TaskRow = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '\u2014';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function statusTone(status: string): 'ok' | 'warn' | 'bad' | 'neutral' | 'flame' {
  const s = status.toUpperCase();
  if (s === 'COMPLETED') return 'ok';
  if (s === 'IN_PROGRESS') return 'flame';
  if (s === 'PENDING') return 'warn';
  if (s === 'CANCELLED') return 'bad';
  return 'neutral';
}

function metaLine(t: TaskRow): string {
  return [t.priority, formatDate(t.dueDate)].filter(Boolean).join(' · ');
}

export function TasksClient() {
  const [items, setItems] = useState<TaskRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load() {
    const result = await apiFetch<TaskRow[]>('/tasks');
    if (!result.ok) {
      setError(result.error.message);
      setItems([]);
      return;
    }
    setError(null);
    setItems(result.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(input: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
  }) {
    setCreating(true);
    const result = await apiFetch<TaskRow>('/tasks', { method: 'POST', body: input });
    setCreating(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setCreateOpen(false);
    await load();
  }

  if (items === null && !error) {
    return (
      <>
        <PageHeader
          eyebrow={'Opera\u00e7\u00e3o'}
          title="Tarefas"
          description={'Atividades pendentes por usu\u00e1rio e oportunidade.'}
        />
        <LoadingState />
      </>
    );
  }

  const rows = items ?? [];

  return (
    <>
      <PageHeader
        eyebrow={'Opera\u00e7\u00e3o'}
        title="Tarefas"
        description={'Atividades pendentes por usu\u00e1rio e oportunidade.'}
        action={
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            Nova tarefa
          </button>
        }
      />
      {error ? (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa"
          description="Crie tarefas a partir de leads, oportunidades ou atendimento."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((t) => (
              <EntityCard
                key={t.id}
                title={t.title}
                badge={<StatusBadge label={t.status} tone={statusTone(t.status)} />}
                meta={metaLine(t) ? <p>{metaLine(t)}</p> : undefined}
                actions={
                  <Link href={`/tarefas/${t.id}`} className="btn-ghost text-xs">
                    Detalhe
                  </Link>
                }
              />
            ))}
          </div>
          <div className="card-panel table-scroll hidden md:block">
            <table className="w-full min-w-[32rem] text-left text-sm text-bone">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-faint">
                <tr>
                  <th className="py-2 pr-4 font-medium">Titulo</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">{'A\u00e7\u00f5es'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 pr-4">
                      <Link href={`/tarefas/${t.id}`} className="text-bone hover:text-flame">
                        {t.title}
                      </Link>
                      <p className="text-xs text-faint">{metaLine(t)}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge label={t.status} tone={statusTone(t.status)} />
                    </td>
                    <td className="py-3">
                      <Link href={`/tarefas/${t.id}`} className="btn-ghost text-xs">
                        Detalhe
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <TaskCreateModal
        open={createOpen}
        busy={creating}
        onClose={() => setCreateOpen(false)}
        onSubmit={(input) => void handleCreate(input)}
      />
    </>
  );
}
