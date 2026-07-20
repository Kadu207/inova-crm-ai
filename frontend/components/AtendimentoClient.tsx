'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { apiFetch } from '@/lib/api';

const CHATWOOT_URL = process.env.NEXT_PUBLIC_CHATWOOT_URL ?? 'https://chat-crm.inovatitech.com.br';

type ConversationRow = {
  id: string;
  status: string;
  channel?: string | null;
  chatwootId?: number | null;
  lastMessageAt?: string | null;
  contact?: { id: string; name: string; phone?: string | null; email?: string | null } | null;
  lead?: { id: string; title: string; status: string } | null;
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function AtendimentoClient() {
  const [items, setItems] = useState<ConversationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await apiFetch<ConversationRow[]>('/conversations');
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
  }, []);

  if (items === null && !error) {
    return (
      <>
        <PageHeader
          title="Atendimento"
          description="Conversas sincronizadas via Chatwoot — canais omnichannel."
        />
        <LoadingState />
      </>
    );
  }

  if (error && items === null) {
    return (
      <>
        <PageHeader
          title="Atendimento"
          description="Conversas sincronizadas via Chatwoot — canais omnichannel."
        />
        <ErrorState message={error} />
      </>
    );
  }

  const rows = items ?? [];

  return (
    <>
      <PageHeader
        title="Atendimento"
        description="Conversas sincronizadas via Chatwoot — resposta humana no Chatwoot."
      />
      {error ? <p className="mb-4 text-sm text-amber-700">{error}</p> : null}
      <div className="mb-4">
        <a
          href={CHATWOOT_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-md bg-[var(--inova-flame)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Abrir Chatwoot
        </a>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma conversa"
          description="Mensagens no Chatwoot disparam sync-conversation (n8n) e aparecem aqui."
        />
      ) : (
        <ul className="divide-y divide-[var(--inova-border)] rounded-lg border border-[var(--inova-border)] bg-white">
          {rows.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--inova-ink)]">
                  {c.contact?.name ||
                    c.lead?.title ||
                    `Conversa ${c.chatwootId ?? c.id.slice(0, 8)}`}
                </p>
                <p className="text-sm text-[var(--inova-muted)]">
                  {[c.channel, c.status, c.contact?.phone, c.lead ? `Lead: ${c.lead.title}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p className="text-xs text-[var(--inova-muted)]">
                  Última msg: {formatDate(c.lastMessageAt)}
                  {c.chatwootId != null ? ` · CW #${c.chatwootId}` : ''}
                </p>
              </div>
              <a
                href={CHATWOOT_URL}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-sm font-medium text-[var(--inova-flame)] hover:underline"
              >
                Responder no Chatwoot
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
