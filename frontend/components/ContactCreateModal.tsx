'use client';

import { FormEvent, useState } from 'react';

type CompanyOption = { id: string; name: string };

type ContactCreateModalProps = {
  open: boolean;
  busy?: boolean;
  companies: CompanyOption[];
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    email?: string;
    phone?: string;
    title?: string;
    companyId?: string;
  }) => void;
};

export function ContactCreateModal({
  open,
  busy,
  companies,
  onClose,
  onSubmit,
}: ContactCreateModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState('');

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      title: title.trim() || undefined,
      companyId: companyId || undefined,
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
        aria-labelledby="contact-create-title"
        className="relative z-10 w-full max-w-md rounded-t-lg border border-line bg-panel p-4 shadow-elevated sm:rounded-lg sm:p-6"
      >
        <h2 id="contact-create-title" className="font-display text-lg text-bone">
          Novo contato
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
              placeholder="Ex.: Maria Silva"
            />
          </label>
          <label className="block text-sm text-smoke">
            E-mail
            <input
              type="email"
              className="input-field mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Opcional"
            />
          </label>
          <label className="block text-sm text-smoke">
            Telefone
            <input
              className="input-field mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Opcional"
            />
          </label>
          <label className="block text-sm text-smoke">
            Cargo
            <input
              className="input-field mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Opcional"
            />
          </label>
          <label className="block text-sm text-smoke">
            Empresa
            <select
              className="input-field mt-1"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              <option value="">Sem empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
              {busy ? 'Salvando\u2026' : 'Criar contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
