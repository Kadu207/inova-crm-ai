'use client';

import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { EntityCard } from '@/components/EntityCard';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
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

function convTone(status: string): 'ok' | 'warn' | 'neutral' | 'bad' | 'flame' {
  switch (status) {
    case 'OPEN':
      return 'flame';
    case 'PENDING':
      return 'warn';
    case 'RESOLVED':
      return 'ok';
    default:
      return 'neutral';
  }
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
          eyebrow="Canais"
          title="Atendimento"
          description="Conversas sincronizadas via Chatwoot — resposta humana no Chatwoot."
        />
        <LoadingState />
      </>
    );
  }

  if (error && items === null) {
    return (
      <>
        <PageHeader
          eyebrow="Canais"
          title="Atendimento"
          description="Conversas sincronizadas via Chatwoot — resposta humana no Chatwoot."
        />
        <ErrorState message={error} />
      </>
    );
  }

  const rows = items ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Canais"
        title="Atendimento"
        description="Conversas sincronizadas via Chatwoot — resposta humana no Chatwoot."
        action={
          <a href={CHATWOOT_URL} target="_blank" rel="noreferrer" className="btn-primary">
            Abrir Chatwoot
          </a>
        }
      />
      {error ? (
        <div className="mb-3">
          <ErrorState message={error} />
        </div>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma conversa"
          description="Mensagens no Chatwoot disparam sync-conversation (n8n) e aparecem aqui."
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((c) => {
              const title =
                c.contact?.name || c.lead?.title || `Conversa ${c.chatwootId ?? c.id.slice(0, 8)}`;
              return (
                <EntityCard
                  key={c.id}
                  title={title}
                  badge={<StatusBadge label={c.status} tone={convTone(c.status)} />}
                  meta={
                    <p>
                      {[c.channel, c.contact?.phone, c.lead ? `Lead: ${c.lead.title}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                      <br />
                      Última msg: {formatDate(c.lastMessageAt)}
                      {c.chatwootId != null ? ` · CW #${c.chatwootId}` : ''}
                    </p>
                  }
                  actions={
                    <a
                      href={CHATWOOT_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost text-xs"
                    >
                      Responder no Chatwoot
                    </a>
                  }
                />
              );
            })}
          </div>

          <div className="card-panel table-scroll hidden md:block">
            <table className="w-full min-w-[36rem] text-left text-sm text-bone">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-faint">
                <tr>
                  <th className="py-2 pr-4 font-medium">Contato / Lead</th>
                  <th className="py-2 pr-4 font-medium">Canal</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Última msg</th>
                  <th className="py-2 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => (
                  <tr key={c.id} className="align-top">
                    <td className="max-w-md break-words py-3 pr-4">
                      <p>
                        {c.contact?.name ||
                          c.lead?.title ||
                          `Conversa ${c.chatwootId ?? c.id.slice(0, 8)}`}
                      </p>
                      {c.lead ? (
                        <p className="mt-0.5 text-xs text-smoke">Lead: {c.lead.title}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-smoke">{c.channel ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge label={c.status} tone={convTone(c.status)} />
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-smoke">
                      {formatDate(c.lastMessageAt)}
                    </td>
                    <td className="py-3">
                      <a
                        href={CHATWOOT_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost px-2 py-1 text-xs"
                      >
                        Responder
                      </a>
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
