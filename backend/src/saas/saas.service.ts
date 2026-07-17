import { Injectable, NotFoundException } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardTenantDto, UpdateQuotasDto, UpdateTenantStatusDto } from './dto/saas.dto';

@Injectable()
export class SaasService {
  constructor(private readonly prisma: PrismaService) {}

  listTenants(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findTenant(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    return tenant;
  }

  onboard(dto: OnboardTenantDto): Promise<Tenant> {
    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        plan: dto.plan,
      },
    });
  }

  async updateQuotas(id: string, dto: UpdateQuotasDto): Promise<Tenant> {
    await this.findTenant(id);
    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async updateStatus(id: string, dto: UpdateTenantStatusDto): Promise<Tenant> {
    await this.findTenant(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
