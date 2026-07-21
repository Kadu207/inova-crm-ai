'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ProductRow } from '@/components/ProductsClient';
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
  const id = params.id;
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await apiFetch<ProductRow>(`/products/${id}`);
    if (!result.ok) {
      setError(result.error.message);
      setProduct(null);
      return;
    }
    setError(null);
    setProduct(result.data);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

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
          <Link href="/produtos" className="btn-ghost">
            Voltar
          </Link>
        }
      />
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
    </>
  );
}
