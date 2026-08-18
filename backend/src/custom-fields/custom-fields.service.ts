import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomFieldDefinition, CustomFieldModule, CustomFieldType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomFieldDto, UpdateCustomFieldDto } from './dto/custom-field.dto';

@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, module?: CustomFieldModule): Promise<CustomFieldDefinition[]> {
    return this.prisma.customFieldDefinition.findMany({
      where: { tenantId, ...(module ? { module } : {}) },
      orderBy: { apiName: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<CustomFieldDefinition> {
    const row = await this.prisma.customFieldDefinition.findFirst({ where: { id, tenantId } });
    if (!row) throw new NotFoundException(`CustomFieldDefinition ${id} not found`);
    return row;
  }

  create(tenantId: string, dto: CreateCustomFieldDto): Promise<CustomFieldDefinition> {
    return this.prisma.customFieldDefinition.create({
      data: {
        tenantId,
        module: dto.module,
        apiName: dto.apiName,
        label: dto.label,
        type: dto.type,
        required: dto.required ?? false,
        options: dto.options === undefined ? undefined : (dto.options as Prisma.InputJsonValue),
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCustomFieldDto,
  ): Promise<CustomFieldDefinition> {
    await this.findOne(tenantId, id);
    const result = await this.prisma.customFieldDefinition.updateMany({
      where: { id, tenantId },
      data: {
        label: dto.label,
        required: dto.required,
        options: dto.options === undefined ? undefined : (dto.options as Prisma.InputJsonValue),
      },
    });
    if (result.count === 0) throw new NotFoundException(`CustomFieldDefinition ${id} not found`);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.customFieldDefinition.deleteMany({ where: { id, tenantId } });
  }

  /**
   * Validate customFields map against definitions for LEAD or CONTACT.
   */
  async validateCustomFields(
    tenantId: string,
    module: CustomFieldModule,
    values: Record<string, unknown> | null | undefined,
  ): Promise<Prisma.InputJsonValue | undefined> {
    if (values == null) return undefined;
    const defs = await this.findAll(tenantId, module);
    const byName = new Map(defs.map((d) => [d.apiName, d]));

    for (const def of defs) {
      if (
        def.required &&
        (values[def.apiName] === undefined ||
          values[def.apiName] === null ||
          values[def.apiName] === '')
      ) {
        throw new BadRequestException(`customFields.${def.apiName} is required`);
      }
    }

    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(values)) {
      const def = byName.get(key);
      if (!def) {
        throw new BadRequestException(`Unknown custom field: ${key}`);
      }
      out[key] = this.coerce(def.type, val, key);
    }
    return out as Prisma.InputJsonValue;
  }

  private coerce(type: CustomFieldType, val: unknown, key: string): unknown {
    switch (type) {
      case CustomFieldType.TEXT:
        return String(val);
      case CustomFieldType.NUMBER: {
        const n = Number(val);
        if (!Number.isFinite(n))
          throw new BadRequestException(`customFields.${key} must be number`);
        return n;
      }
      case CustomFieldType.BOOLEAN:
        return Boolean(val);
      case CustomFieldType.DATE:
        return String(val);
      case CustomFieldType.PICKLIST:
        return String(val);
      default: {
        const _exhaustive: never = type;
        return _exhaustive;
      }
    }
  }
}
