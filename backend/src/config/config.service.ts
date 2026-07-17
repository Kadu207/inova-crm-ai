import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SetConfigDto } from './dto/config.dto';

@Injectable()
export class TenantConfigService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.tenantConfig.findMany({ where: { tenantId } });
  }

  async get(tenantId: string, key: string) {
    return this.prisma.tenantConfig.findUnique({
      where: { tenantId_key: { tenantId, key } },
    });
  }

  async set(tenantId: string, dto: SetConfigDto) {
    return this.prisma.tenantConfig.upsert({
      where: { tenantId_key: { tenantId, key: dto.key } },
      create: {
        tenantId,
        key: dto.key,
        value: dto.value as Prisma.InputJsonValue,
      },
      update: { value: dto.value as Prisma.InputJsonValue },
    });
  }
}
