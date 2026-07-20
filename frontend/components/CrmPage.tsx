'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { fetchListStub } from '@/lib/api';

type CrmItem = {
  id: string;
  name?: string | null;
  title?: string | null;
  email?: string | null;
  status?: string | null;
  channel?: string | null;
  chatwootId?: number | null;
  source?: string | null;
  sku?: string | null;
  document?: string | null;
};

type CrmPageProps = {
  title: string;
  description: string;
  resource: string;
  emptyTitle: string;
  emptyDescription: string;
  actionLabel?: string;
};

function itemLabel(item: CrmItem): string {
  if (item.chatwootId != null) {
    const parts = [`#${item.chatwootId}`, item.channel, item.status].filter(Boolean);
    return parts.join(' · ');
  }

  const primary =
    item.title?.trim() ||
    item.name?.trim() ||
    item.email?.trim() ||
    item.sku?.trim() ||
    item.document?.trim();

  if (primary && item.status) {
    return `${primary} · ${item.status}`;
  }
  if (primary && item.source) {
    return `${primary} · ${item.source}`;
  }
  return primary || item.id;
}

export function CrmPage({
  title,
  description,
  resource,
  emptyTitle,
  emptyDescription,
  actionLabel = 'Criar registro',
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

  if (items === null && !error) {
    return (
      <>
        <PageHeader title={title} description={description} />
        <LoadingState />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={title} description={description} />
        <ErrorState message={error} />
      </>
    );
  }

  const rows = items ?? [];

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={<button className="btn-primary">{actionLabel}</button>}
      />
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="card-panel">
          <ul className="divide-y divide-line">
            {rows.map((item) => (
              <li key={item.id} className="break-words py-3 text-sm text-bone">
                {itemLabel(item)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export function CrmPageLoading() {
  return <LoadingState />;
}
