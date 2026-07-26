import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Tenant, TenantStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardTenantDto, UpdateQuotasDto, UpdateTenantStatusDto } from './dto/saas.dto';

export type OnboardTenantResult = Tenant & {
  adminUserId?: string;
  adminEmail?: string;
};

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

  async onboard(dto: OnboardTenantDto): Promise<OnboardTenantResult> {
    const slug = dto.slug.trim().toLowerCase();
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException('Tenant slug already exists');
    }

    const wantsAdmin = Boolean(dto.adminEmail || dto.adminPassword || dto.adminName);
    if (wantsAdmin) {
      if (!dto.adminEmail || !dto.adminPassword || !dto.adminName) {
        throw new BadRequestException(
          'adminName, adminEmail and adminPassword are required together',
        );
      }
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name.trim(),
        slug,
        plan: dto.plan,
        status: TenantStatus.TRIAL,
      },
    });

    if (!wantsAdmin || !dto.adminEmail || !dto.adminPassword || !dto.adminName) {
      return tenant;
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
    const user = await this.prisma.withTenant(tenant.id, (tx) =>
      tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail!.trim().toLowerCase(),
          name: dto.adminName!.trim(),
          passwordHash,
          role: UserRole.ADMIN,
          isActive: true,
        },
      }),
    );

    return {
      ...tenant,
      adminUserId: user.id,
      adminEmail: user.email,
    };
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
