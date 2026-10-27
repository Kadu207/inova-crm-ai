import { normalizeChatwootChannel, resolveChatwootIdentity } from './chatwoot-channel';

describe('normalizeChatwootChannel', () => {
  it('maps Chatwoot class names to short labels', () => {
    expect(normalizeChatwootChannel('Channel::Telegram')).toBe('telegram');
    expect(normalizeChatwootChannel('Channel::Whatsapp')).toBe('whatsapp');
    expect(normalizeChatwootChannel('Channel::Email')).toBe('email');
    expect(normalizeChatwootChannel('Channel::Api')).toBe('api');
    expect(normalizeChatwootChannel('')).toBe('chatwoot');
    expect(normalizeChatwootChannel(undefined)).toBe('chatwoot');
  });
});

describe('resolveChatwootIdentity', () => {
  it('stores telegram id apart from whatsapp', () => {
    const identity = resolveChatwootIdentity({
      channel: 'Channel::Telegram',
      senderIdentifier: '99887766',
      whatsappExternalId: '99887766',
      telegramUsername: '@InovaBot',
    });
    expect(identity).toEqual({
      channel: 'telegram',
      telegramExternalId: '99887766',
      telegramUsername: 'InovaBot',
    });
    expect(identity.whatsappExternalId).toBeUndefined();
  });

  it('keeps Evolution/WhatsApp identifier when channel is not telegram', () => {
    expect(
      resolveChatwootIdentity({
        channel: 'Channel::Api',
        senderIdentifier: '5511999999999@s.whatsapp.net',
      }),
    ).toEqual({
      channel: 'api',
      whatsappExternalId: '5511999999999@s.whatsapp.net',
    });
    expect(
      resolveChatwootIdentity({
        whatsappExternalId: '5511999999999',
      }),
    ).toEqual({
      channel: 'chatwoot',
      whatsappExternalId: '5511999999999',
    });
  });

  it('uses legacy whatsapp field as telegram id when channel is telegram', () => {
    expect(
      resolveChatwootIdentity({
        channel: 'telegram',
        whatsappExternalId: '4242',
      }).telegramExternalId,
    ).toBe('4242');
  });
});
