import { Injectable, NotFoundException } from '@nestjs/common';
import { Company } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string): Promise<Company[]> {
    return this.prisma.company.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async findOne(tenantId: string, id: string): Promise<Company> {
    const company = await this.prisma.company.findFirst({ where: { id, tenantId } });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  create(tenantId: string, dto: CreateCompanyDto): Promise<Company> {
    return this.prisma.company.create({ data: { tenantId, ...dto } });
  }

  async update(tenantId: string, id: string, dto: UpdateCompanyDto): Promise<Company> {
    await this.findOne(tenantId, id);
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.company.delete({ where: { id } });
  }
}
