import { Injectable, NotFoundException } from '@nestjs/common';
import { Contract, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto, UpdateContractDto } from './dto/contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string): Promise<Contract[]> {
    return this.prisma.contract.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(tenantId: string, id: string): Promise<Contract> {
    const contract = await this.prisma.contract.findFirst({ where: { id, tenantId } });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);
    return contract;
  }

  create(tenantId: string, dto: CreateContractDto): Promise<Contract> {
    return this.prisma.contract.create({
      data: {
        tenantId,
        title: dto.title,
        proposalId: dto.proposalId,
        companyId: dto.companyId,
        value: dto.value !== undefined ? new Prisma.Decimal(dto.value) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateContractDto): Promise<Contract> {
    await this.findOne(tenantId, id);
    return this.prisma.contract.update({
      where: { id },
      data: {
        title: dto.title,
        status: dto.status,
        value: dto.value !== undefined ? new Prisma.Decimal(dto.value) : undefined,
      },
    });
  }
}
