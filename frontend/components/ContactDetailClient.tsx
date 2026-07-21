'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
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

  const load = useCallback(async () => {
    const result = await apiFetch<ContactRow>(`/contacts/${id}`);
    if (!result.ok) {
      setError(result.error.message);
      setContact(null);
      return;
    }
    setError(null);
    setContact(result.data);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

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
          <Link href="/contatos" className="btn-ghost">
            Voltar
          </Link>
        }
      />
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
    </>
  );
}
