import { Injectable, NotFoundException } from '@nestjs/common';
import { Payment, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(tenantId: string, id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findFirst({ where: { id, tenantId } });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return payment;
  }

  create(tenantId: string, dto: CreatePaymentDto): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        tenantId,
        invoiceId: dto.invoiceId,
        amount: new Prisma.Decimal(dto.amount),
        method: dto.method,
        reference: dto.reference,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdatePaymentDto): Promise<Payment> {
    await this.findOne(tenantId, id);
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: dto.status,
        paidAt: dto.status === PaymentStatus.COMPLETED ? new Date() : undefined,
      },
    });
  }
}
