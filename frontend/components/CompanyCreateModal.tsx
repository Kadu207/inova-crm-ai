'use client';

import { FormEvent, useState } from 'react';

type CompanyCreateModalProps = {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    document?: string;
    website?: string;
    industry?: string;
  }) => void;
};

export function CompanyCreateModal({ open, busy, onClose, onSubmit }: CompanyCreateModalProps) {
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      document: document.trim() || undefined,
      website: website.trim() || undefined,
      industry: industry.trim() || undefined,
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
        aria-labelledby="company-create-title"
        className="relative z-10 w-full max-w-md rounded-t-lg border border-line bg-panel p-4 shadow-elevated sm:rounded-lg sm:p-6"
      >
        <h2 id="company-create-title" className="font-display text-lg text-bone">
          Nova empresa
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
              placeholder="Ex.: Acme Ltda"
            />
          </label>
          <label className="block text-sm text-smoke">
            Documento (CNPJ)
            <input
              className="input-field mt-1"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              placeholder="Opcional"
            />
          </label>
          <label className="block text-sm text-smoke">
            Website
            <input
              className="input-field mt-1"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
            />
          </label>
          <label className="block text-sm text-smoke">
            Setor
            <input
              className="input-field mt-1"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Opcional"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
              {busy ? 'Salvando\u2026' : 'Criar empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
