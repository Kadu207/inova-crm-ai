'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { ProductRow } from '@/components/ProductsClient';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
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

export function ProductDetailClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    const result = await apiFetch<ProductRow>(`/products/${id}`);
    if (!result.ok) {
      setError(result.error.message);
      setProduct(null);
      return;
    }
    setError(null);
    setProduct(result.data);
    setName(result.data.name);
    setPrice(String(result.data.price ?? 0));
    setIsActive(result.data.isActive !== false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeProduct() {
    if (!product) return;
    setBusy(true);
    const result = await apiFetch<void>(`/products/${product.id}`, { method: 'DELETE' });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      setConfirmDelete(false);
      return;
    }
    router.push('/produtos');
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!product) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const parsed = Number(price);
    setBusy(true);
    const result = await apiFetch<ProductRow>(`/products/${product.id}`, {
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
    setProduct(result.data);
    setEditing(false);
    setError(null);
  }

  if (!product && !error) {
    return (
      <>
        <PageHeader eyebrow={'Cat\u00e1logo'} title="Produto" description="Carregando\u2026" />
        <LoadingState />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <PageHeader
          eyebrow={'Cat\u00e1logo'}
          title="Produto"
          description="Detalhe"
          action={
            <Link href="/produtos" className="btn-ghost">
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
        title={product.name}
        description="Detalhe do produto"
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/produtos" className="btn-ghost">
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
            <span className="text-faint">SKU:</span>{' '}
            <span className="text-bone">{product.sku || '\u2014'}</span>
          </p>
          <p>
            <span className="text-faint">Preco:</span>{' '}
            <span className="text-bone">{formatMoney(product.price)}</span>
          </p>
          <p>
            <span className="text-faint">Status:</span>{' '}
            {product.isActive === false ? (
              <StatusBadge label="INATIVO" tone="bad" />
            ) : (
              <StatusBadge label="ATIVO" tone="ok" />
            )}
          </p>
          <p>
            <span className="text-faint">Descricao:</span>{' '}
            <span className="text-bone">{product.description || '\u2014'}</span>
          </p>
          <p>
            <span className="text-faint">Atualizado:</span>{' '}
            <span className="text-bone">{formatDate(product.updatedAt)}</span>
          </p>
        </div>
      )}
      <ConfirmDeleteModal
        open={confirmDelete}
        busy={busy}
        entityLabel={product.name}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void removeProduct()}
      />
    </>
  );
}
