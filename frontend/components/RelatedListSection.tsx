'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type RelatedItem = { id: string; title?: string; name?: string; status?: string };

type Props = {
  path: string;
  label: string;
  hrefPrefix: string;
};

export function RelatedListSection({ path, label, hrefPrefix }: Props) {
  const [items, setItems] = useState<RelatedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await apiFetch<RelatedItem[]>(path);
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
  }, [path]);

  return (
    <section className="mt-6 border-t border-[var(--border)] pt-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</h2>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {items === null ? <p className="mt-2 text-sm text-[var(--muted)]">Carregando…</p> : null}
      {items && items.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted)]">Nenhum registro.</p>
      ) : null}
      {items && items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`${hrefPrefix}/${item.id}`}
                className="text-[var(--accent)] hover:underline"
              >
                {item.title || item.name || item.id}
              </Link>
              {item.status ? <span className="ml-2 text-[var(--muted)]">{item.status}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
