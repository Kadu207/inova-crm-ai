import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LeadStatus, LeadSource } from '@prisma/client';
import { LeadsService } from './leads.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';

const tenantId = 'tenant-1';

const mockLead = {
  id: 'lead-1',
  tenantId,
  title: 'Test Lead',
  status: LeadStatus.NEW,
  source: LeadSource.MANUAL,
  contactId: 'contact-1',
  companyId: null,
  assignedToId: null,
  score: 0,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('LeadsService', () => {
  let service: LeadsService;
  let prisma: {
    lead: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    contact: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
    conversation: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
    pipeline: { findFirst: jest.Mock };
    opportunity: { create: jest.Mock };
  };
  let events: { publish: jest.Mock };

  beforeEach(async () => {
    prisma = {
      lead: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      contact: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      conversation: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      pipeline: { findFirst: jest.fn() },
      opportunity: { create: jest.fn() },
    };
    events = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsService, useValue: events },
        {
          provide: CustomFieldsService,
          useValue: { validateCustomFields: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(LeadsService);
  });

  it('findAll returns tenant-scoped leads', async () => {
    prisma.lead.findMany.mockResolvedValue([mockLead]);
    prisma.lead.count.mockResolvedValue(1);
    const result = await service.findAll(tenantId);
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId, deletedAt: null }),
      }),
    );
  });

  it('findOne throws when lead not in tenant', async () => {
    prisma.lead.findFirst.mockResolvedValue(null);
    await expect(service.findOne(tenantId, 'missing')).rejects.toThrow(NotFoundException);
  });

  it('create publishes lead.created event', async () => {
    prisma.lead.create.mockResolvedValue(mockLead);
    const result = await service.create(tenantId, { title: 'Test Lead' });
    expect(result.id).toBe('lead-1');
    expect(events.publish).toHaveBeenCalledWith(
      tenantId,
      'lead.created',
      expect.objectContaining({ leadId: 'lead-1' }),
    );
  });

  it('qualify updates status and publishes lead.qualified', async () => {
    const qualified = { ...mockLead, status: LeadStatus.QUALIFIED, score: 80 };
    prisma.lead.findFirst.mockResolvedValueOnce(mockLead).mockResolvedValueOnce(qualified);
    prisma.lead.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.qualify(tenantId, 'lead-1', { score: 80 });
    expect(result.status).toBe(LeadStatus.QUALIFIED);
    expect(prisma.lead.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'lead-1', tenantId } }),
    );
    expect(events.publish).toHaveBeenCalledWith(
      tenantId,
      'lead.qualified',
      expect.objectContaining({ leadId: 'lead-1' }),
    );
  });

  it('inbound dedupes open lead by phone contact', async () => {
    prisma.contact.findFirst.mockResolvedValue({
      id: 'contact-1',
      name: 'Alice',
      phone: '+5511999',
      email: null,
    });
    prisma.contact.update.mockResolvedValue({
      id: 'contact-1',
      name: 'Alice',
      phone: '+5511999',
      email: null,
    });
    prisma.lead.findFirst
      .mockResolvedValueOnce(mockLead) // findOpenLeadByContact / findOne path
      .mockResolvedValueOnce({ ...mockLead, notes: 'message=oi' });
    prisma.lead.updateMany.mockResolvedValue({ count: 1 });
    prisma.conversation.findFirst.mockResolvedValue(null);
    prisma.conversation.create.mockResolvedValue({ id: 'conv-1' });

    const result = await service.inboundFromChatwoot(tenantId, {
      name: 'Alice',
      phone: '+5511999',
      message: 'oi',
      conversationId: 42,
      event: 'message_created',
    });

    expect(result.id).toBe('lead-1');
    expect(prisma.lead.create).not.toHaveBeenCalled();
    expect(prisma.lead.updateMany).toHaveBeenCalled();
    expect(events.publish).toHaveBeenCalledWith(
      tenantId,
      'lead.updated',
      expect.objectContaining({ deduped: true }),
    );
  });

  it('inbound upserts by whatsappExternalId when phone missing', async () => {
    prisma.contact.findFirst.mockResolvedValue(null);
    prisma.contact.create.mockResolvedValue({
      id: 'contact-wa',
      name: 'Sem Telefone',
      phone: null,
      email: null,
      whatsappExternalId: '5511999999999',
    });
    prisma.lead.findFirst.mockResolvedValue(null);
    prisma.lead.create.mockResolvedValue({
      ...mockLead,
      id: 'lead-wa',
      contactId: 'contact-wa',
      source: LeadSource.CHATWOOT,
    });
    prisma.conversation.findFirst.mockResolvedValue(null);
    prisma.conversation.create.mockResolvedValue({ id: 'conv-wa' });

    const result = await service.inboundFromChatwoot(tenantId, {
      name: 'Sem Telefone',
      whatsappExternalId: '5511999999999',
      message: 'oi sem phone',
      conversationId: 99,
    });

    expect(result.id).toBe('lead-wa');
    expect(prisma.contact.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        whatsappExternalId: '5511999999999',
        phone: undefined,
      }),
    });
  });

  it('convert creates opportunity and marks CONVERTED', async () => {
    const converted = { ...mockLead, status: LeadStatus.CONVERTED };
    prisma.lead.findFirst.mockResolvedValueOnce(mockLead).mockResolvedValueOnce(converted);
    prisma.pipeline.findFirst.mockResolvedValue({
      id: 'pipe-1',
      stages: [{ id: 'stage-1', pipelineId: 'pipe-1', order: 1 }],
    });
    prisma.opportunity.create.mockResolvedValue({
      id: 'opp-1',
      leadId: 'lead-1',
      stageId: 'stage-1',
    });
    prisma.lead.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.convert(tenantId, 'lead-1', {});
    expect(result.lead.status).toBe(LeadStatus.CONVERTED);
    expect(result.opportunity.id).toBe('opp-1');
    expect(prisma.lead.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'lead-1', tenantId } }),
    );
    expect(events.publish).toHaveBeenCalledWith(
      tenantId,
      'lead.converted',
      expect.objectContaining({ opportunityId: 'opp-1' }),
    );
  });

  it('convert rejects already converted lead', async () => {
    prisma.lead.findFirst.mockResolvedValue({
      ...mockLead,
      status: LeadStatus.CONVERTED,
    });
    await expect(service.convert(tenantId, 'lead-1', {})).rejects.toThrow(BadRequestException);
  });
});
