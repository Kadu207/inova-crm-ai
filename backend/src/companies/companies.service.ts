import { Injectable, NotFoundException } from '@nestjs/common';
import { Company, Prisma } from '@prisma/client';
import { actorCreateFields, actorUpdateFields, detailAuditInclude } from '../common/audit-fields';
import { listResult, ListQueryInput, ListResult, parseListQuery } from '../common/list-query';
import { notDeleted } from '../common/soft-delete';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: ListQueryInput = {}): Promise<ListResult<Company>> {
    const q = parseListQuery(query);
    const where: Prisma.CompanyWhereInput = {
      tenantId,
      ...notDeleted,
      ...(q.q
        ? {
            OR: [
              { name: { contains: q.q, mode: 'insensitive' } },
              { document: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(q.createdFrom || q.createdTo
        ? {
            createdAt: {
              ...(q.createdFrom ? { gte: q.createdFrom } : {}),
              ...(q.createdTo ? { lte: q.createdTo } : {}),
            },
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy: { [q.sortField]: q.sortDir },
        skip: q.skip,
        take: q.pageSize,
      }),
      this.prisma.company.count({ where }),
    ]);
    return listResult(data, total, q.page, q.pageSize);
  }

  async findOne(tenantId: string, id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, tenantId, ...notDeleted },
      include: detailAuditInclude,
    });
    if (!company) throw new NotFoundException(`Company ${id} not found`);
    return company;
  }

  create(tenantId: string, dto: CreateCompanyDto, actorUserId?: string): Promise<Company> {
    return this.prisma.company.create({
      data: { tenantId, ...dto, ...actorCreateFields(actorUserId) },
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCompanyDto,
    actorUserId?: string,
  ): Promise<Company> {
    await this.findOne(tenantId, id);
    return this.prisma.company.update({
      where: { id },
      data: { ...dto, ...actorUpdateFields(actorUserId) },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async listContacts(tenantId: string, companyId: string) {
    await this.findOne(tenantId, companyId);
    return this.prisma.contact.findMany({
      where: { tenantId, companyId, ...notDeleted },
      orderBy: { name: 'asc' },
    });
  }

  async listLeads(tenantId: string, companyId: string) {
    await this.findOne(tenantId, companyId);
    return this.prisma.lead.findMany({
      where: { tenantId, companyId, ...notDeleted },
      orderBy: { createdAt: 'desc' },
    });
  }
}
