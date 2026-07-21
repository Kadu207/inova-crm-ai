'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { ContactRow } from '@/components/ContactsClient';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { apiFetch } from '@/lib/api';

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function ContactDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [contact, setContact] = useState<ContactRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');

  const load = useCallback(async () => {
    const result = await apiFetch<ContactRow>(`/contacts/${id}`);
    if (!result.ok) {
      setError(result.error.message);
      setContact(null);
      return;
    }
    setError(null);
    setContact(result.data);
    setName(result.data.name);
    setEmail(result.data.email ?? '');
    setPhone(result.data.phone ?? '');
    setTitle(result.data.title ?? '');
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!contact) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    const result = await apiFetch<ContactRow>(`/contacts/${contact.id}`, {
      method: 'PATCH',
      body: {
        name: trimmed,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        title: title.trim() || undefined,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setContact(result.data);
    setEditing(false);
    setError(null);
  }

  if (!contact && !error) {
    return (
      <>
        <PageHeader eyebrow="CRM" title="Contato" description="Carregando\u2026" />
        <LoadingState />
      </>
    );
  }

  if (error || !contact) {
    return (
      <>
        <PageHeader
          eyebrow="CRM"
          title="Contato"
          description="Detalhe"
          action={
            <Link href="/contatos" className="btn-ghost">
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
        eyebrow="CRM"
        title={contact.name}
        description="Detalhe do contato"
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/contatos" className="btn-ghost">
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
            Nome
            <input
              className="input-field mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm text-smoke">
            E-mail
            <input
              type="email"
              className="input-field mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm text-smoke">
            Telefone
            <input
              className="input-field mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block text-sm text-smoke">
            Cargo
            <input
              className="input-field mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
            {busy ? 'Salvando\u2026' : 'Salvar'}
          </button>
        </form>
      ) : (
        <div className="card-panel space-y-3 text-sm">
          <p>
            <span className="text-faint">E-mail:</span>{' '}
            <span className="text-bone">{contact.email || '\u2014'}</span>
          </p>
          <p>
            <span className="text-faint">Telefone:</span>{' '}
            <span className="text-bone">{contact.phone || '\u2014'}</span>
          </p>
          <p>
            <span className="text-faint">Cargo:</span>{' '}
            <span className="text-bone">{contact.title || '\u2014'}</span>
          </p>
          <p>
            <span className="text-faint">Empresa:</span>{' '}
            {contact.companyId ? (
              <Link href={`/empresas/${contact.companyId}`} className="text-flame hover:underline">
                Ver empresa
              </Link>
            ) : (
              <span className="text-bone">{'\u2014'}</span>
            )}
          </p>
          <p>
            <span className="text-faint">Atualizado:</span>{' '}
            <span className="text-bone">{formatDate(contact.updatedAt)}</span>
          </p>
        </div>
      )}
    </>
  );
}
