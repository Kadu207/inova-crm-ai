import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { FinanceService } from './finance.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

const tenantId = 'tenant-1';

const mockInvoice = {
  id: 'inv-1',
  tenantId,
  number: 'INV-001',
  status: InvoiceStatus.DRAFT,
  amount: new Prisma.Decimal(1000),
  contractId: null,
  companyId: null,
  dueDate: null,
  paidAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('FinanceService', () => {
  let service: FinanceService;
  let prisma: {
    invoice: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let events: { publish: jest.Mock };

  beforeEach(async () => {
    prisma = {
      invoice: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    events = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsService, useValue: events },
      ],
    }).compile();

    service = module.get(FinanceService);
  });

  it('create publishes invoice.created', async () => {
    prisma.invoice.create.mockResolvedValue(mockInvoice);
    const result = await service.create(tenantId, {
      number: 'INV-001',
      amount: 1000,
    });
    expect(result.number).toBe('INV-001');
    expect(events.publish).toHaveBeenCalledWith(
      tenantId,
      'invoice.created',
      expect.objectContaining({ invoiceId: 'inv-1' }),
    );
  });

  it('approve transitions DRAFT to APPROVED', async () => {
    prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
    const approved = { ...mockInvoice, status: InvoiceStatus.APPROVED };
    prisma.invoice.update.mockResolvedValue(approved);

    const result = await service.approve(tenantId, 'inv-1');
    expect(result.status).toBe(InvoiceStatus.APPROVED);
    expect(events.publish).toHaveBeenCalledWith(
      tenantId,
      'invoice.approved',
      expect.objectContaining({ invoiceId: 'inv-1' }),
    );
  });

  it('markPaid rejects DRAFT invoices', async () => {
    prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
    await expect(service.markPaid(tenantId, 'inv-1')).rejects.toThrow(BadRequestException);
  });

  it('findOne throws for missing invoice', async () => {
    prisma.invoice.findFirst.mockResolvedValue(null);
    await expect(service.findOne(tenantId, 'missing')).rejects.toThrow(NotFoundException);
  });
});
