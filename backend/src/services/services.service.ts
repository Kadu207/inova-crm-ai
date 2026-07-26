import { Injectable, NotFoundException } from '@nestjs/common';
import { Service, Prisma } from '@prisma/client';
import { actorCreateFields, actorUpdateFields, detailAuditInclude } from '../common/audit-fields';
import { listResult, ListQueryInput, ListResult, parseListQuery } from '../common/list-query';
import { notDeleted } from '../common/soft-delete';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: ListQueryInput = {}): Promise<ListResult<Service>> {
    const q = parseListQuery(query);
    const where: Prisma.ServiceWhereInput = {
      tenantId,
      ...notDeleted,
      ...(q.q
        ? {
            OR: [
              { name: { contains: q.q, mode: 'insensitive' } },
              { code: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        orderBy: { [q.sortField]: q.sortDir },
        skip: q.skip,
        take: q.pageSize,
      }),
      this.prisma.service.count({ where }),
    ]);
    return listResult(data, total, q.page, q.pageSize);
  }

  async findOne(tenantId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId, ...notDeleted },
      include: detailAuditInclude,
    });
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    return service;
  }

  create(tenantId: string, dto: CreateServiceDto, actorUserId?: string): Promise<Service> {
    return this.prisma.service.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
        ...actorCreateFields(actorUserId),
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateServiceDto,
    actorUserId?: string,
  ): Promise<Service> {
    await this.findOne(tenantId, id);
    return this.prisma.service.update({
      where: { id },
      data: {
        name: dto.name,
        isActive: dto.isActive,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
        ...actorUpdateFields(actorUserId),
      },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.service.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
