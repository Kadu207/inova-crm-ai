'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
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
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [priority, setPriority] = useState('MEDIUM');

  const load = useCallback(async () => {
    const result = await apiFetch<TaskRow>(`/tasks/${id}`);
    if (!result.ok) {
      setError(result.error.message);
      setTask(null);
      return;
    }
    setError(null);
    setTask(result.data);
    setTitle(result.data.title);
    setDescription(result.data.description ?? '');
    setStatus(result.data.status);
    setPriority(result.data.priority);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!task) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    const result = await apiFetch<TaskRow>(`/tasks/${task.id}`, {
      method: 'PATCH',
      body: {
        title: trimmed,
        description: description.trim() || undefined,
        status,
        priority,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setTask(result.data);
    setEditing(false);
    setError(null);
  }

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
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/tarefas" className="btn-ghost">
              Voltar
            </Link>
            <button
              type="button"
              className="btn-ghost"
              disabled={busy}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          </div>
        }
      />
      {error ? (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      ) : null}
      {editing ? (
        <form className="card-panel space-y-4" onSubmit={(e) => void save(e)}>
          <label className="block text-sm text-smoke">
            Titulo
            <input
              className="input-field mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm text-smoke">
            Status
            <select
              className="input-field mt-1"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>
          <label className="block text-sm text-smoke">
            Prioridade
            <select
              className="input-field mt-1"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </label>
          <label className="block text-sm text-smoke">
            Descricao
            <textarea
              className="input-field mt-1 min-h-[5rem]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <p className="text-xs text-faint">Prazo atual: {formatDate(task.dueDate)}</p>
          <button type="submit" className="btn-primary" disabled={busy || !title.trim()}>
            {busy ? 'Salvando\u2026' : 'Salvar'}
          </button>
        </form>
      ) : (
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
      )}
    </>
  );
}
