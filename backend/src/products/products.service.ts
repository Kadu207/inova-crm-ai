import { Injectable, NotFoundException } from '@nestjs/common';
import { Product, Prisma } from '@prisma/client';
import { actorCreateFields, actorUpdateFields, detailAuditInclude } from '../common/audit-fields';
import { listResult, ListQueryInput, ListResult, parseListQuery } from '../common/list-query';
import { notDeleted } from '../common/soft-delete';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: ListQueryInput = {}): Promise<ListResult<Product>> {
    const q = parseListQuery(query);
    const where: Prisma.ProductWhereInput = {
      tenantId,
      ...notDeleted,
      ...(q.q
        ? {
            OR: [
              { name: { contains: q.q, mode: 'insensitive' } },
              { sku: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { [q.sortField]: q.sortDir },
        skip: q.skip,
        take: q.pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);
    return listResult(data, total, q.page, q.pageSize);
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, ...notDeleted },
      include: detailAuditInclude,
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  create(tenantId: string, dto: CreateProductDto, actorUserId?: string): Promise<Product> {
    return this.prisma.product.create({
      data: {
        tenantId,
        name: dto.name,
        sku: dto.sku,
        description: dto.description,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
        ...actorCreateFields(actorUserId),
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateProductDto,
    actorUserId?: string,
  ): Promise<Product> {
    await this.findOne(tenantId, id);
    const result = await this.prisma.product.updateMany({
      where: { id, tenantId },
      data: {
        name: dto.name,
        isActive: dto.isActive,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
        ...actorUpdateFields(actorUserId),
      },
    });
    if (result.count === 0) throw new NotFoundException(`Product ${id} not found`);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.product.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
  }
}
