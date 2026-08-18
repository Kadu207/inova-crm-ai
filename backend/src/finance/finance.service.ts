import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { assertNever } from '../common/utils';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async findAll(tenantId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  async create(tenantId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        number: dto.number,
        amount: new Prisma.Decimal(dto.amount),
        status: dto.status ?? InvoiceStatus.DRAFT,
        contractId: dto.contractId,
        companyId: dto.companyId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });

    await this.events.publish(tenantId, 'invoice.created', {
      invoiceId: invoice.id,
      number: invoice.number,
      amount: invoice.amount.toString(),
    });

    return invoice;
  }

  async update(tenantId: string, id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    await this.findOne(tenantId, id);
    const result = await this.prisma.invoice.updateMany({
      where: { id, tenantId },
      data: {
        status: dto.status,
        amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
    if (result.count === 0) throw new NotFoundException(`Invoice ${id} not found`);
    return this.findOne(tenantId, id);
  }

  async approve(tenantId: string, id: string): Promise<Invoice> {
    const invoice = await this.findOne(tenantId, id);
    if (
      invoice.status !== InvoiceStatus.DRAFT &&
      invoice.status !== InvoiceStatus.PENDING_APPROVAL
    ) {
      throw new BadRequestException('Invoice cannot be approved in current status');
    }

    const result = await this.prisma.invoice.updateMany({
      where: { id, tenantId },
      data: { status: InvoiceStatus.APPROVED },
    });
    if (result.count === 0) throw new NotFoundException(`Invoice ${id} not found`);
    const updated = await this.findOne(tenantId, id);

    await this.events.publish(tenantId, 'invoice.approved', {
      invoiceId: updated.id,
    });

    return updated;
  }

  async markPaid(tenantId: string, id: string): Promise<Invoice> {
    const invoice = await this.findOne(tenantId, id);
    this.assertPayableStatus(invoice.status);

    const result = await this.prisma.invoice.updateMany({
      where: { id, tenantId },
      data: { status: InvoiceStatus.PAID, paidAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException(`Invoice ${id} not found`);
    const updated = await this.findOne(tenantId, id);

    await this.events.publish(tenantId, 'invoice.paid', {
      invoiceId: updated.id,
      paidAt: updated.paidAt?.toISOString(),
    });

    return updated;
  }

  private assertPayableStatus(status: InvoiceStatus): void {
    switch (status) {
      case InvoiceStatus.APPROVED:
      case InvoiceStatus.SENT:
      case InvoiceStatus.OVERDUE:
        return;
      case InvoiceStatus.DRAFT:
      case InvoiceStatus.PENDING_APPROVAL:
      case InvoiceStatus.PAID:
      case InvoiceStatus.CANCELLED:
        throw new BadRequestException(`Cannot mark invoice as paid from status: ${status}`);
      default:
        assertNever(status);
    }
  }
}
