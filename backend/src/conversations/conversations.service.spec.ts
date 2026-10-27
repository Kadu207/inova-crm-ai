import { Test, TestingModule } from '@nestjs/testing';
import { ConversationStatus } from '@prisma/client';
import { ConversationsService } from './conversations.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

const tenantId = 'tenant-1';

describe('ConversationsService syncFromChatwoot', () => {
  let service: ConversationsService;
  let prisma: {
    conversation: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
    };
    contact: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
    lead: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      conversation: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      contact: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      lead: { findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsService, useValue: { publish: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get(ConversationsService);
  });

  it('updates channel to telegram and links telegram id inside the tenant', async () => {
    prisma.contact.findFirst.mockResolvedValue(null);
    prisma.contact.create.mockResolvedValue({ id: 'contact-tg', tenantId });
    prisma.lead.findFirst.mockResolvedValue(null);
    prisma.conversation.findFirst.mockResolvedValue({
      id: 'conv-1',
      tenantId,
      chatwootId: 15,
      channel: 'chatwoot',
    });
    prisma.conversation.updateMany.mockResolvedValue({ count: 1 });
    prisma.conversation.findFirst
      .mockResolvedValueOnce({
        id: 'conv-1',
        tenantId,
        chatwootId: 15,
        channel: 'chatwoot',
      })
      .mockResolvedValueOnce({
        id: 'conv-1',
        tenantId,
        chatwootId: 15,
        channel: 'telegram',
        contact: { id: 'contact-tg', name: 'Ada', telegramUsername: 'ada' },
        lead: null,
      });

    const result = await service.syncFromChatwoot(tenantId, {
      conversationId: 15,
      channel: 'Channel::Telegram',
      senderIdentifier: '99887766',
      whatsappExternalId: '99887766',
      telegramUsername: '@ada',
      name: 'Ada',
    });

    expect(prisma.contact.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ tenantId, telegramExternalId: '99887766' }),
    });
    expect(prisma.contact.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId,
        telegramExternalId: '99887766',
        telegramUsername: 'ada',
        whatsappExternalId: undefined,
      }),
    });
    expect(prisma.conversation.updateMany).toHaveBeenCalledWith({
      where: { id: 'conv-1', tenantId },
      data: expect.objectContaining({ channel: 'telegram', contactId: 'contact-tg' }),
    });
    expect(result.channel).toBe('telegram');
  });

  it('keeps whatsapp identity for Channel::Api when creating a conversation', async () => {
    prisma.contact.findFirst.mockResolvedValue(null);
    prisma.contact.create.mockResolvedValue({ id: 'contact-wa', tenantId });
    prisma.lead.findFirst.mockResolvedValue(null);
    prisma.conversation.findFirst.mockResolvedValue(null);
    prisma.conversation.create.mockResolvedValue({
      id: 'conv-wa',
      tenantId,
      channel: 'api',
      chatwootId: 3,
      status: ConversationStatus.OPEN,
    });
    prisma.conversation.updateMany.mockResolvedValue({ count: 1 });
    prisma.conversation.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'conv-wa',
      tenantId,
      channel: 'api',
      contact: null,
      lead: null,
    });

    await service.syncFromChatwoot('tenant-b', {
      conversationId: 3,
      channel: 'Channel::Api',
      senderIdentifier: '5511999999999@s.whatsapp.net',
      name: 'WA',
    });

    expect(prisma.contact.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-b',
        whatsappExternalId: '5511999999999@s.whatsapp.net',
      }),
    });
    expect(prisma.conversation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: 'tenant-b', channel: 'api' }),
    });
  });
});
