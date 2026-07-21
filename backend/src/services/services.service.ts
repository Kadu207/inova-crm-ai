import { Injectable, NotFoundException } from '@nestjs/common';
import { Service, Prisma } from '@prisma/client';
import { notDeleted } from '../common/soft-delete';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: { tenantId, ...notDeleted },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Service> {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId, ...notDeleted },
    });
    if (!service) throw new NotFoundException(`Service ${id} not found`);
    return service;
  }

  create(tenantId: string, dto: CreateServiceDto): Promise<Service> {
    return this.prisma.service.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateServiceDto): Promise<Service> {
    await this.findOne(tenantId, id);
    return this.prisma.service.update({
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
    await this.prisma.service.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
