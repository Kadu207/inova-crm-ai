'use client';

import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { EntityCard } from '@/components/EntityCard';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { apiFetch } from '@/lib/api';

const CHATWOOT_URL = process.env.NEXT_PUBLIC_CHATWOOT_URL ?? 'https://chat-crm.inovatitech.com.br';

type ChannelFilter = 'all' | 'whatsapp' | 'telegram';

type ConversationRow = {
  id: string;
  status: string;
  channel?: string | null;
  chatwootId?: number | null;
  lastMessageAt?: string | null;
  contact?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    telegramUsername?: string | null;
  } | null;
  lead?: { id: string; title: string; status: string } | null;
};

type ConversationMessage = {
  id: string;
  direction: string;
  channel?: string | null;
  body?: string | null;
  contentType?: string | null;
  sentAt: string;
  attachments?: Array<{ fileType?: string; fileName?: string; dataUrl?: string }> | null;
};

type ConversationDetail = ConversationRow & {
  messages?: ConversationMessage[];
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function channelLabel(channel?: string | null): string {
  switch ((channel ?? '').toLowerCase()) {
    case 'telegram':
      return 'Telegram';
    case 'whatsapp':
      return 'WhatsApp';
    case 'email':
      return 'Email';
    case 'instagram':
      return 'Instagram';
    case 'facebook':
      return 'Facebook';
    case 'api':
      return 'API';
    case 'web':
      return 'Web';
    case 'sms':
      return 'SMS';
    case 'chatwoot':
      return 'Chatwoot';
    default: {
      if (!channel) return '—';
      return channel;
    }
  }
}

function contactMeta(contact?: ConversationRow['contact']): string | null {
  if (!contact) return null;
  if (contact.telegramUsername) return `@${contact.telegramUsername.replace(/^@+/, '')}`;
  return contact.phone ?? null;
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

const FILTERS: { id: ChannelFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'telegram', label: 'Telegram' },
];

export function AtendimentoClient() {
  const [filter, setFilter] = useState<ChannelFilter>('all');
  const [items, setItems] = useState<ConversationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = useCallback(async (channel: ChannelFilter) => {
    const path =
      channel === 'all'
        ? '/conversations'
        : `/conversations?channel=${encodeURIComponent(channel)}`;
    const result = await apiFetch<ConversationRow[]>(path);
    if (!result.ok) {
      setError(result.error.message);
      setItems([]);
      return;
    }
    setError(null);
    setItems(result.data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setItems(null);
      const path =
        filter === 'all'
          ? '/conversations'
          : `/conversations?channel=${encodeURIComponent(filter)}`;
      const result = await apiFetch<ConversationRow[]>(path);
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
  }, [filter]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      setDetailLoading(true);
      setDetailError(null);
      const result = await apiFetch<ConversationDetail>(`/conversations/${selectedId}`);
      if (cancelled) return;
      setDetailLoading(false);
      if (!result.ok) {
        setDetailError(result.error.message);
        setDetail(null);
        return;
      }
      setDetail(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  if (items === null && !error) {
    return (
      <>
        <PageHeader
          eyebrow="Canais"
          title="Atendimento"
          description="Conversas WhatsApp e Telegram via Chatwoot — origem visível no fio."
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
          description="Conversas WhatsApp e Telegram via Chatwoot — origem visível no fio."
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
        description="Conversas WhatsApp e Telegram via Chatwoot — origem visível no fio."
        action={
          <a href={CHATWOOT_URL} target="_blank" rel="noreferrer" className="btn-primary">
            Abrir Chatwoot
          </a>
        }
      />
      {error ? (
        <div className="mb-3">
          <ErrorState message={error} onRetry={() => void loadList(filter)} />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={
              filter === f.id ? 'btn-primary px-3 py-1 text-xs' : 'btn-ghost px-3 py-1 text-xs'
            }
            onClick={() => {
              setFilter(f.id);
              setSelectedId(null);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhuma conversa"
          description="Mensagens no Chatwoot disparam lead-inbound (n8n) e aparecem aqui com a origem do canal."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-3">
            <div className="space-y-3 md:hidden">
              {rows.map((c) => {
                const title =
                  c.contact?.name ||
                  c.lead?.title ||
                  `Conversa ${c.chatwootId ?? c.id.slice(0, 8)}`;
                return (
                  <EntityCard
                    key={c.id}
                    title={title}
                    badge={<StatusBadge label={c.status} tone={convTone(c.status)} />}
                    meta={
                      <p>
                        {[
                          channelLabel(c.channel),
                          contactMeta(c.contact),
                          c.lead ? `Lead: ${c.lead.title}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                        <br />
                        Última msg: {formatDate(c.lastMessageAt)}
                        {c.chatwootId != null ? ` · CW #${c.chatwootId}` : ''}
                      </p>
                    }
                    actions={
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-ghost text-xs"
                          onClick={() => setSelectedId(c.id)}
                        >
                          Ver mensagens
                        </button>
                        <a
                          href={CHATWOOT_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-ghost text-xs"
                        >
                          Responder no Chatwoot
                        </a>
                      </div>
                    }
                  />
                );
              })}
            </div>

            <div className="card-panel table-scroll hidden md:block">
              <table className="w-full min-w-[28rem] text-left text-sm text-bone">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-faint">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Contato / Lead</th>
                    <th className="py-2 pr-4 font-medium">Canal</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((c) => (
                    <tr
                      key={c.id}
                      className={`align-top ${selectedId === c.id ? 'bg-flame/5' : ''}`}
                    >
                      <td className="max-w-md break-words py-3 pr-4">
                        <button
                          type="button"
                          className="text-left hover:text-flame"
                          onClick={() => setSelectedId(c.id)}
                        >
                          <p>
                            {c.contact?.name ||
                              c.lead?.title ||
                              `Conversa ${c.chatwootId ?? c.id.slice(0, 8)}`}
                          </p>
                          {c.lead ? (
                            <p className="mt-0.5 text-xs text-smoke">Lead: {c.lead.title}</p>
                          ) : null}
                          <p className="mt-0.5 text-xs text-faint">
                            Última: {formatDate(c.lastMessageAt)}
                          </p>
                        </button>
                      </td>
                      <td className="py-3 pr-4 text-smoke">
                        {channelLabel(c.channel)}
                        {contactMeta(c.contact) ? (
                          <p className="mt-0.5 text-xs">{contactMeta(c.contact)}</p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge label={c.status} tone={convTone(c.status)} />
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
          </div>

          <div className="card-panel flex min-h-[20rem] flex-col">
            {!selectedId ? (
              <p className="m-auto text-center text-sm text-smoke">
                Selecione uma conversa para ver o fio com a origem (WhatsApp ou Telegram).
              </p>
            ) : detailLoading ? (
              <LoadingState />
            ) : detailError ? (
              <ErrorState message={detailError} />
            ) : detail ? (
              <>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-line pb-3">
                  <div>
                    <p className="font-medium text-bone">
                      {detail.contact?.name ||
                        detail.lead?.title ||
                        `Conversa ${detail.chatwootId ?? detail.id.slice(0, 8)}`}
                    </p>
                    <p className="mt-1 text-xs text-smoke">
                      {[channelLabel(detail.channel), contactMeta(detail.contact)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <a
                    href={CHATWOOT_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost px-2 py-1 text-xs"
                  >
                    Responder no Chatwoot
                  </a>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {(detail.messages ?? []).length === 0 ? (
                    <p className="text-sm text-smoke">
                      Nenhuma mensagem gravada ainda. Novas mensagens do Chatwoot aparecem aqui.
                    </p>
                  ) : (
                    (detail.messages ?? []).map((m) => {
                      const inbound = m.direction === 'inbound';
                      return (
                        <div
                          key={m.id}
                          className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[90%] rounded-lg border px-3 py-2 text-sm ${
                              inbound
                                ? 'border-line bg-ink/40 text-bone'
                                : 'border-flame/30 bg-flame/10 text-bone'
                            }`}
                          >
                            <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-faint">
                              <span>{channelLabel(m.channel || detail.channel)}</span>
                              <span>{inbound ? 'Entrada' : 'Saída'}</span>
                              <span>{formatDate(m.sentAt)}</span>
                            </div>
                            {m.body ? (
                              <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            ) : null}
                            {m.attachments && m.attachments.length > 0 ? (
                              <ul className="mt-2 space-y-1 text-xs text-smoke">
                                {m.attachments.map((a, idx) => (
                                  <li key={`${m.id}-att-${idx}`}>
                                    {a.dataUrl ? (
                                      <a
                                        href={a.dataUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-flame underline"
                                      >
                                        {a.fileName || a.fileType || 'Anexo'}
                                      </a>
                                    ) : (
                                      <span>{a.fileName || a.fileType || 'Anexo'}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
