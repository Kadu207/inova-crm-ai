'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
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
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    const result = await apiFetch<ServiceRow>(`/services/${id}`);
    if (!result.ok) {
      setError(result.error.message);
      setService(null);
      return;
    }
    setError(null);
    setService(result.data);
    setName(result.data.name);
    setPrice(String(result.data.price ?? 0));
    setIsActive(result.data.isActive !== false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!service) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const parsed = Number(price);
    setBusy(true);
    const result = await apiFetch<ServiceRow>(`/services/${service.id}`, {
      method: 'PATCH',
      body: {
        name: trimmed,
        price: Number.isFinite(parsed) ? parsed : 0,
        isActive,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setService(result.data);
    setEditing(false);
    setError(null);
  }

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
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/servicos" className="btn-ghost">
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
            Preco
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field mt-1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-smoke">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Ativo
          </label>
          <button type="submit" className="btn-primary" disabled={busy || !name.trim()}>
            {busy ? 'Salvando\u2026' : 'Salvar'}
          </button>
        </form>
      ) : (
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
      )}
    </>
  );
}
