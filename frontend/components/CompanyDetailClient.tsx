'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { CompanyRow } from '@/components/CompaniesClient';
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
  const id = params.id;
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await apiFetch<CompanyRow>(`/companies/${id}`);
    if (!result.ok) {
      setError(result.error.message);
      setCompany(null);
      return;
    }
    setError(null);
    setCompany(result.data);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

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
          <Link href="/empresas" className="btn-ghost">
            Voltar
          </Link>
        }
      />
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
    </>
  );
}
