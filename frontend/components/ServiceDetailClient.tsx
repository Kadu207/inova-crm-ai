'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ServiceRow } from '@/components/ServicesClient';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiFetch } from '@/lib/api';

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatMoney(value: string | number | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(n)) return String(value ?? '\u2014');
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ServiceDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [service, setService] = useState<ServiceRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await apiFetch<ServiceRow>(`/services/${id}`);
    if (!result.ok) {
      setError(result.error.message);
      setService(null);
      return;
    }
    setError(null);
    setService(result.data);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!service && !error) {
    return (
      <>
        <PageHeader
          eyebrow={'Cat\u00e1logo'}
          title={'Servi\u00e7o'}
          description="Carregando\u2026"
        />
        <LoadingState />
      </>
    );
  }

  if (error || !service) {
    return (
      <>
        <PageHeader
          eyebrow={'Cat\u00e1logo'}
          title={'Servi\u00e7o'}
          description="Detalhe"
          action={
            <Link href="/servicos" className="btn-ghost">
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
        eyebrow={'Cat\u00e1logo'}
        title={service.name}
        description={'Detalhe do servi\u00e7o'}
        action={
          <Link href="/servicos" className="btn-ghost">
            Voltar
          </Link>
        }
      />
      <div className="card-panel space-y-3 text-sm">
        <p>
          <span className="text-faint">Codigo:</span>{' '}
          <span className="text-bone">{service.code || '\u2014'}</span>
        </p>
        <p>
          <span className="text-faint">Preco:</span>{' '}
          <span className="text-bone">{formatMoney(service.price)}</span>
        </p>
        <p>
          <span className="text-faint">Status:</span>{' '}
          {service.isActive === false ? (
            <StatusBadge label="INATIVO" tone="bad" />
          ) : (
            <StatusBadge label="ATIVO" tone="ok" />
          )}
        </p>
        <p>
          <span className="text-faint">Descricao:</span>{' '}
          <span className="text-bone">{service.description || '\u2014'}</span>
        </p>
        <p>
          <span className="text-faint">Atualizado:</span>{' '}
          <span className="text-bone">{formatDate(service.updatedAt)}</span>
        </p>
      </div>
    </>
  );
}
