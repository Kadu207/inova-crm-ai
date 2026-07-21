import { Injectable, NotFoundException } from '@nestjs/common';
import { Product, Prisma } from '@prisma/client';
import { notDeleted } from '../common/soft-delete';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { tenantId, ...notDeleted },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, ...notDeleted },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  create(tenantId: string, dto: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({
      data: {
        tenantId,
        name: dto.name,
        sku: dto.sku,
        description: dto.description,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto): Promise<Product> {
    await this.findOne(tenantId, id);
    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        isActive: dto.isActive,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
      },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
