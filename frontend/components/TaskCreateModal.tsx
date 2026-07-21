'use client';

import { FormEvent, useState } from 'react';

type TaskCreateModalProps = {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
  }) => void;
};

export function TaskCreateModal({ open, busy, onClose, onSubmit }: TaskCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit({
      title: trimmed,
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-create-title"
        className="relative z-10 w-full max-w-md rounded-t-lg border border-line bg-panel p-4 shadow-elevated sm:rounded-lg sm:p-6"
      >
        <h2 id="task-create-title" className="font-display text-lg text-bone">
          Nova tarefa
        </h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-smoke">
            Titulo
            <input
              className="input-field mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
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
            Prazo
            <input
              type="datetime-local"
              className="input-field mt-1"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
          <label className="block text-sm text-smoke">
            Descricao
            <textarea
              className="input-field mt-1 min-h-[5rem]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={busy || !title.trim()}>
              {busy ? 'Salvando\u2026' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
