'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { EntityCard } from '@/components/EntityCard';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { fetchListStub } from '@/lib/api';

type CrmItem = {
  id: string;
  name?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  channel?: string | null;
  chatwootId?: number | null;
  source?: string | null;
  sku?: string | null;
  document?: string | null;
  value?: string | number | null;
};

type CrmPageProps = {
  title: string;
  description: string;
  resource: string;
  emptyTitle: string;
  emptyDescription: string;
  actionLabel?: string;
  eyebrow?: string;
};

function itemPrimary(item: CrmItem): string {
  if (item.chatwootId != null) {
    const parts = [`#${item.chatwootId}`, item.channel, item.status].filter(Boolean);
    return parts.join(' · ');
  }

  return (
    item.title?.trim() ||
    item.name?.trim() ||
    item.email?.trim() ||
    item.sku?.trim() ||
    item.document?.trim() ||
    item.id
  );
}

function itemMeta(item: CrmItem): string {
  const parts = [
    item.email,
    item.phone,
    item.source,
    item.value != null && item.value !== '' ? String(item.value) : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

function statusTone(status?: string | null): 'ok' | 'warn' | 'bad' | 'neutral' | 'flame' {
  if (!status) return 'neutral';
  const s = status.toUpperCase();
  if (s === 'OPEN' || s === 'ACTIVE' || s === 'QUALIFIED' || s === 'WON') return 'ok';
  if (s === 'NEW' || s === 'PENDING' || s === 'CONTACTED') return 'warn';
  if (s === 'LOST' || s === 'CANCELLED') return 'bad';
  return 'neutral';
}

export function CrmPage({
  title,
  description,
  resource,
  emptyTitle,
  emptyDescription,
  actionLabel = 'Criar registro',
  eyebrow,
}: CrmPageProps) {
  const [items, setItems] = useState<CrmItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchListStub<CrmItem>(resource);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error.message);
        setItems([]);
        return;
      }
      setError(null);
      setItems(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [resource]);

  const header = (
    <PageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      action={<button className="btn-primary">{actionLabel}</button>}
    />
  );

  if (items === null && !error) {
    return (
      <>
        {header}
        <LoadingState />
      </>
    );
  }

  if (error && items === null) {
    return (
      <>
        {header}
        <ErrorState message={error} />
      </>
    );
  }

  const rows = items ?? [];

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={<button className="btn-primary">{actionLabel}</button>}
      />
      {error ? (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((item) => (
              <EntityCard
                key={item.id}
                title={itemPrimary(item)}
                badge={
                  item.status ? (
                    <StatusBadge label={item.status} tone={statusTone(item.status)} />
                  ) : undefined
                }
                meta={itemMeta(item) ? <p>{itemMeta(item)}</p> : undefined}
              />
            ))}
          </div>

          <div className="card-panel table-scroll hidden md:block">
            <table className="w-full min-w-[32rem] text-left text-sm text-bone">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-faint">
                <tr>
                  <th className="py-2 pr-4 font-medium">Nome</th>
                  <th className="py-2 pr-4 font-medium">Detalhes</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="max-w-md break-words py-3 pr-4">{itemPrimary(item)}</td>
                    <td className="py-3 pr-4 text-smoke">{itemMeta(item) || '—'}</td>
                    <td className="py-3">
                      {item.status ? (
                        <StatusBadge label={item.status} tone={statusTone(item.status)} />
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

export function CrmPageLoading() {
  return <LoadingState />;
}
