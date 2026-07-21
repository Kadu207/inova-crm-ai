'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ContactCreateModal } from '@/components/ContactCreateModal';
import { EmptyState } from '@/components/EmptyState';
import { EntityCard } from '@/components/EntityCard';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { apiFetch } from '@/lib/api';

export type ContactRow = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  companyId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type CompanyOption = { id: string; name: string };

function metaLine(c: ContactRow): string {
  return [c.email, c.phone, c.title].filter(Boolean).join(' · ');
}

export function ContactsClient() {
  const [items, setItems] = useState<ContactRow[] | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load() {
    const [contactsResult, companiesResult] = await Promise.all([
      apiFetch<ContactRow[]>('/contacts'),
      apiFetch<CompanyOption[]>('/companies'),
    ]);
    if (!contactsResult.ok) {
      setError(contactsResult.error.message);
      setItems([]);
      return;
    }
    setError(null);
    setItems(contactsResult.data);
    if (companiesResult.ok) {
      setCompanies(companiesResult.data.map((c) => ({ id: c.id, name: c.name })));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(input: {
    name: string;
    email?: string;
    phone?: string;
    title?: string;
    companyId?: string;
  }) {
    setCreating(true);
    const result = await apiFetch<ContactRow>('/contacts', {
      method: 'POST',
      body: input,
    });
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
          eyebrow="CRM"
          title="Contatos"
          description="Pessoas e decisores do pipeline comercial."
        />
        <LoadingState />
      </>
    );
  }

  const rows = items ?? [];

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Contatos"
        description="Pessoas e decisores do pipeline comercial."
        action={
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            Novo contato
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
          title="Nenhum contato"
          description="Importe contatos ou crie manualmente para iniciar o relacionamento."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((c) => (
              <EntityCard
                key={c.id}
                title={c.name}
                meta={metaLine(c) ? <p>{metaLine(c)}</p> : undefined}
                actions={
                  <Link href={`/contatos/${c.id}`} className="btn-ghost text-xs">
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
                  <th className="py-2 pr-4 font-medium">Nome</th>
                  <th className="py-2 pr-4 font-medium">Detalhes</th>
                  <th className="py-2 font-medium">{'A\u00e7\u00f5es'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4">
                      <Link href={`/contatos/${c.id}`} className="text-bone hover:text-flame">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-smoke">{metaLine(c) || '\u2014'}</td>
                    <td className="py-3">
                      <Link href={`/contatos/${c.id}`} className="btn-ghost text-xs">
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
      <ContactCreateModal
        open={createOpen}
        busy={creating}
        companies={companies}
        onClose={() => setCreateOpen(false)}
        onSubmit={(input) => void handleCreate(input)}
      />
    </>
  );
}
