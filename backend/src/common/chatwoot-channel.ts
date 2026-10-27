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
  if (value.includes('instagram')) return 'instagram';
  if (value.includes('facebook') || value.includes('messenger')) return 'facebook';
  if (value.includes('email')) return 'email';
  if (value.includes('sms') || value.includes('twilio')) return 'sms';
  if (value.includes('webwidget') || value.includes('web_widget')) return 'web';
  if (value === 'api' || value.endsWith('::api')) return 'api';
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
