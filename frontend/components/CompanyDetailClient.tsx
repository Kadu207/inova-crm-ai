'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { CompanyRow } from '@/components/CompaniesClient';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { apiFetch } from '@/lib/api';

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function CompanyDetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');

  const load = useCallback(async () => {
    const result = await apiFetch<CompanyRow>(`/companies/${id}`);
    if (!result.ok) {
      setError(result.error.message);
      setCompany(null);
      return;
    }
    setError(null);
    setCompany(result.data);
    setName(result.data.name);
    setDocument(result.data.document ?? '');
    setWebsite(result.data.website ?? '');
    setIndustry(result.data.industry ?? '');
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeCompany() {
    if (!company) return;
    setBusy(true);
    const result = await apiFetch<void>(`/companies/${company.id}`, { method: 'DELETE' });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      setConfirmDelete(false);
      return;
    }
    router.push('/empresas');
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!company) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    const result = await apiFetch<CompanyRow>(`/companies/${company.id}`, {
      method: 'PATCH',
      body: {
        name: trimmed,
        document: document.trim() || undefined,
        website: website.trim() || undefined,
        industry: industry.trim() || undefined,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setCompany(result.data);
    setEditing(false);
    setError(null);
  }

  if (!company && !error) {
    return (
      <>
        <PageHeader eyebrow="CRM" title="Empresa" description="Carregando\u2026" />
        <LoadingState />
      </>
    );
  }

  if (error || !company) {
    return (
      <>
        <PageHeader
          eyebrow="CRM"
          title="Empresa"
          description="Detalhe"
          action={
            <Link href="/empresas" className="btn-ghost">
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
        title={company.name}
        description="Detalhe da empresa"
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/empresas" className="btn-ghost">
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
            <button
              type="button"
              className="btn-ghost text-bad"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              Excluir
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
            Documento
            <input
              className="input-field mt-1"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
            />
          </label>
          <label className="block text-sm text-smoke">
            Website
            <input
              className="input-field mt-1"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
          <label className="block text-sm text-smoke">
            Setor
            <input
              className="input-field mt-1"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
            {busy ? 'Salvando\u2026' : 'Salvar'}
          </button>
        </form>
      ) : (
        <div className="card-panel space-y-3 text-sm">
          <p>
            <span className="text-faint">Documento:</span>{' '}
            <span className="text-bone">{company.document || '\u2014'}</span>
          </p>
          <p>
            <span className="text-faint">Website:</span>{' '}
            <span className="text-bone">{company.website || '\u2014'}</span>
          </p>
          <p>
            <span className="text-faint">Setor:</span>{' '}
            <span className="text-bone">{company.industry || '\u2014'}</span>
          </p>
          <p>
            <span className="text-faint">Atualizado:</span>{' '}
            <span className="text-bone">{formatDate(company.updatedAt)}</span>
          </p>
        </div>
      )}
      <ConfirmDeleteModal
        open={confirmDelete}
        busy={busy}
        entityLabel={company.name}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void removeCompany()}
      />
    </>
  );
}
