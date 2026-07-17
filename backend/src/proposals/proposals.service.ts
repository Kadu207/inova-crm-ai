import { Injectable, NotFoundException } from '@nestjs/common';
import { Proposal, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProposalDto, UpdateProposalDto } from './dto/proposal.dto';

@Injectable()
export class ProposalsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string): Promise<Proposal[]> {
    return this.prisma.proposal.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(tenantId: string, id: string): Promise<Proposal> {
    const proposal = await this.prisma.proposal.findFirst({ where: { id, tenantId } });
    if (!proposal) throw new NotFoundException(`Proposal ${id} not found`);
    return proposal;
  }

  create(tenantId: string, dto: CreateProposalDto): Promise<Proposal> {
    return this.prisma.proposal.create({
      data: {
        tenantId,
        title: dto.title,
        opportunityId: dto.opportunityId,
        companyId: dto.companyId,
        totalValue: dto.totalValue !== undefined ? new Prisma.Decimal(dto.totalValue) : undefined,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProposalDto): Promise<Proposal> {
    await this.findOne(tenantId, id);
    return this.prisma.proposal.update({
      where: { id },
      data: {
        title: dto.title,
        status: dto.status,
        totalValue: dto.totalValue !== undefined ? new Prisma.Decimal(dto.totalValue) : undefined,
      },
    });
  }
}
