'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { TaskRow } from '@/components/TasksClient';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiFetch } from '@/lib/api';

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

export function TaskDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [task, setTask] = useState<TaskRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await apiFetch<TaskRow>(`/tasks/${id}`);
    if (!result.ok) {
      setError(result.error.message);
      setTask(null);
      return;
    }
    setError(null);
    setTask(result.data);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!task && !error) {
    return (
      <>
        <PageHeader eyebrow={'Opera\u00e7\u00e3o'} title="Tarefa" description="Carregando\u2026" />
        <LoadingState />
      </>
    );
  }

  if (error || !task) {
    return (
      <>
        <PageHeader
          eyebrow={'Opera\u00e7\u00e3o'}
          title="Tarefa"
          description="Detalhe"
          action={
            <Link href="/tarefas" className="btn-ghost">
              Voltar
            </Link>
          }
        />
        <ErrorState message={error ?? 'Nao encontrado'} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={'Opera\u00e7\u00e3o'}
        title={task.title}
        description="Detalhe da tarefa"
        action={
          <Link href="/tarefas" className="btn-ghost">
            Voltar
          </Link>
        }
      />
      <div className="card-panel space-y-3 text-sm">
        <p>
          <span className="text-faint">Status:</span>{' '}
          <StatusBadge label={task.status} tone={statusTone(task.status)} />
        </p>
        <p>
          <span className="text-faint">Prioridade:</span>{' '}
          <span className="text-bone">{task.priority}</span>
        </p>
        <p>
          <span className="text-faint">Prazo:</span>{' '}
          <span className="text-bone">{formatDate(task.dueDate)}</span>
        </p>
        <p>
          <span className="text-faint">Descricao:</span>{' '}
          <span className="text-bone">{task.description || '\u2014'}</span>
        </p>
        <p>
          <span className="text-faint">Atualizado:</span>{' '}
          <span className="text-bone">{formatDate(task.updatedAt)}</span>
        </p>
      </div>
    </>
  );
}
