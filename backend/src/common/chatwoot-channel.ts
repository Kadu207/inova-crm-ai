/** Chatwoot inbox channel → short CRM label. Identity routing stays in the API. */

export interface ChatwootIdentityInput {
  channel?: string | null;
  senderIdentifier?: string | null;
  whatsappExternalId?: string | null;
  telegramUsername?: string | null;
}

export interface ChatwootIdentity {
  channel: string;
  whatsappExternalId?: string;
  telegramExternalId?: string;
  telegramUsername?: string;
}

function trimOrUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** `Channel::Telegram` → `telegram`. Empty stays `chatwoot` (legacy payloads). */
export function normalizeChatwootChannel(raw?: string | null): string {
  const value = raw?.trim().toLowerCase() ?? '';
  if (!value) return 'chatwoot';
  if (value.includes('telegram')) return 'telegram';
  if (value.includes('whatsapp')) return 'whatsapp';
  // Evolution transitional inbox is Channel::Api — treat as WhatsApp in CRM UI/filter
  if (value === 'api' || value.endsWith('::api')) return 'whatsapp';
  if (value.includes('instagram')) return 'instagram';
  if (value.includes('facebook') || value.includes('messenger')) return 'facebook';
  if (value.includes('email')) return 'email';
  if (value.includes('sms') || value.includes('twilio')) return 'sms';
  if (value.includes('webwidget') || value.includes('web_widget')) return 'web';
  const stripped = value.replace(/^channel::/, '').replace(/[^a-z0-9]+/g, '');
  return stripped || 'chatwoot';
}

export function normalizeTelegramUsername(raw?: string | null): string | undefined {
  const value = raw?.trim().replace(/^@+/, '');
  return value ? value : undefined;
}

/**
 * Telegram user id never lands in `whatsappExternalId`.
 * Other channels keep the legacy WhatsApp/Evolution identifier.
 */
export function resolveChatwootIdentity(input: ChatwootIdentityInput): ChatwootIdentity {
  const channel = normalizeChatwootChannel(input.channel);
  const identifier = trimOrUndefined(input.senderIdentifier);
  const legacyWa = trimOrUndefined(input.whatsappExternalId);
  if (channel === 'telegram') {
    return {
      channel,
      telegramExternalId: identifier || legacyWa,
      telegramUsername: normalizeTelegramUsername(input.telegramUsername),
    };
  }
  return {
    channel,
    whatsappExternalId: legacyWa || identifier,
  };
}

/**
 * Chatwoot message_type: 0 incoming, 1 outgoing, 2 activity (and variants).
 * Returns null when the payload must not become a ConversationMessage.
 */
export function resolveChatwootMessageDirection(input: {
  messageType?: string | number | null;
  private?: boolean | null;
}): 'inbound' | 'outbound' | null {
  if (input.private === true) return null;
  const raw = input.messageType;
  if (raw === undefined || raw === null || raw === '') {
    return 'inbound';
  }
  const value = String(raw).trim().toLowerCase();
  if (value === '2' || value === 'activity' || value === 'template' || value.includes('activity')) {
    return null;
  }
  if (value === '1' || value === 'outgoing' || value === 'outbound') {
    return 'outbound';
  }
  if (value === '0' || value === 'incoming' || value === 'inbound') {
    return 'inbound';
  }
  // Unknown numeric / string — treat as inbound contact message
  return 'inbound';
}

export type ChatwootAttachmentMeta = {
  fileType?: string;
  fileName?: string;
  dataUrl?: string;
  extension?: string;
};

/** Keep only safe metadata — no binary download. */
export function normalizeChatwootAttachments(raw?: unknown): ChatwootAttachmentMeta[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: ChatwootAttachmentMeta[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const fileType =
      typeof row.file_type === 'string'
        ? row.file_type
        : typeof row.fileType === 'string'
          ? row.fileType
          : undefined;
    const fileName =
      typeof row.file_name === 'string'
        ? row.file_name
        : typeof row.fileName === 'string'
          ? row.fileName
          : undefined;
    const dataUrl =
      typeof row.data_url === 'string'
        ? row.data_url
        : typeof row.dataUrl === 'string'
          ? row.dataUrl
          : undefined;
    const extension = typeof row.extension === 'string' ? row.extension : undefined;
    if (fileType || fileName || dataUrl || extension) {
      out.push({ fileType, fileName, dataUrl, extension });
    }
  }
  return out.length > 0 ? out : undefined;
}
