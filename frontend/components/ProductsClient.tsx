'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { EntityCard } from '@/components/EntityCard';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { ProductCreateModal } from '@/components/ProductCreateModal';
import { StatusBadge } from '@/components/StatusBadge';
import { apiFetch } from '@/lib/api';

export type ProductRow = {
  id: string;
  name: string;
  sku?: string | null;
  price?: string | number | null;
  description?: string | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
};

function formatMoney(value: string | number | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(n)) return String(value ?? '\u2014');
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function metaLine(p: ProductRow): string {
  return [p.sku, formatMoney(p.price)].filter(Boolean).join(' · ');
}

export function ProductsClient() {
  const [items, setItems] = useState<ProductRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load() {
    const result = await apiFetch<ProductRow[]>('/products');
    if (!result.ok) {
      setError(result.error.message);
      setItems([]);
      return;
    }
    setError(null);
    setItems(result.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(input: {
    name: string;
    sku?: string;
    price?: number;
    description?: string;
  }) {
    setCreating(true);
    const result = await apiFetch<ProductRow>('/products', { method: 'POST', body: input });
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
          eyebrow={'Cat\u00e1logo'}
          title="Produtos"
          description={'Cat\u00e1logo de produtos para propostas e contratos.'}
        />
        <LoadingState />
      </>
    );
  }

  const rows = items ?? [];

  return (
    <>
      <PageHeader
        eyebrow={'Cat\u00e1logo'}
        title="Produtos"
        description={'Cat\u00e1logo de produtos para propostas e contratos.'}
        action={
          <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
            Novo produto
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
          title={'Cat\u00e1logo vazio'}
          description={'Cadastre produtos com pre\u00e7o e SKU para uso comercial.'}
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((p) => (
              <EntityCard
                key={p.id}
                title={p.name}
                badge={
                  p.isActive === false ? (
                    <StatusBadge label="INATIVO" tone="bad" />
                  ) : (
                    <StatusBadge label="ATIVO" tone="ok" />
                  )
                }
                meta={metaLine(p) ? <p>{metaLine(p)}</p> : undefined}
                actions={
                  <Link href={`/produtos/${p.id}`} className="btn-ghost text-xs">
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
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-4">
                      <Link href={`/produtos/${p.id}`} className="text-bone hover:text-flame">
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-smoke">{metaLine(p) || '\u2014'}</td>
                    <td className="py-3">
                      <Link href={`/produtos/${p.id}`} className="btn-ghost text-xs">
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
      <ProductCreateModal
        open={createOpen}
        busy={creating}
        onClose={() => setCreateOpen(false)}
        onSubmit={(input) => void handleCreate(input)}
      />
    </>
  );
}
