'use client';

import { FormEvent, useState } from 'react';

type ServiceCreateModalProps = {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; code?: string; price?: number; description?: string }) => void;
};

export function ServiceCreateModal({ open, busy, onClose, onSubmit }: ServiceCreateModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const parsed = price.trim() === '' ? undefined : Number(price);
    onSubmit({
      name: trimmed,
      code: code.trim() || undefined,
      price: parsed != null && Number.isFinite(parsed) ? parsed : undefined,
      description: description.trim() || undefined,
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
        aria-labelledby="service-create-title"
        className="relative z-10 w-full max-w-md rounded-t-lg border border-line bg-panel p-4 shadow-elevated sm:rounded-lg sm:p-6"
      >
        <h2 id="service-create-title" className="font-display text-lg text-bone">
          Novo servico
        </h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-smoke">
            Nome
            <input
              className="input-field mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="block text-sm text-smoke">
            Codigo
            <input
              className="input-field mt-1"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Opcional"
            />
          </label>
          <label className="block text-sm text-smoke">
            Preco
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field mt-1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
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
            <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
              {busy ? 'Salvando\u2026' : 'Criar servico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
