import { Injectable, NotFoundException } from '@nestjs/common';
import { Contact, Prisma } from '@prisma/client';
import { actorCreateFields, actorUpdateFields, detailAuditInclude } from '../common/audit-fields';
import { listResult, ListQueryInput, ListResult, parseListQuery } from '../common/list-query';
import { notDeleted } from '../common/soft-delete';
import { compileFilterToPrisma, parseSearchBody } from '../common/filter-engine/filter-engine';
import { AdvancedSearchDto } from '../common/dto/advanced-search.dto';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customFields: CustomFieldsService,
  ) {}

  async findAll(tenantId: string, query: ListQueryInput = {}): Promise<ListResult<Contact>> {
    const q = parseListQuery(query);
    const where: Prisma.ContactWhereInput = {
      tenantId,
      ...notDeleted,
      ...(q.q
        ? {
            OR: [
              { name: { contains: q.q, mode: 'insensitive' } },
              { email: { contains: q.q, mode: 'insensitive' } },
              { phone: { contains: q.q, mode: 'insensitive' } },
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
      this.prisma.contact.findMany({
        where,
        orderBy: { [q.sortField]: q.sortDir },
        skip: q.skip,
        take: q.pageSize,
      }),
      this.prisma.contact.count({ where }),
    ]);
    return listResult(data, total, q.page, q.pageSize);
  }

  async search(tenantId: string, body: AdvancedSearchDto): Promise<ListResult<Contact>> {
    const q = parseSearchBody(body);
    const where = compileFilterToPrisma('contact', tenantId, q.filter) as Prisma.ContactWhereInput;
    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy: { [q.sortField]: q.sortDir },
        skip: q.skip,
        take: q.pageSize,
      }),
      this.prisma.contact.count({ where }),
    ]);
    return listResult(data, total, q.page, q.pageSize);
  }

  async findOne(tenantId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId, ...notDeleted },
      include: detailAuditInclude,
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    return contact;
  }

  async create(tenantId: string, dto: CreateContactDto, actorUserId?: string): Promise<Contact> {
    const customFields = await this.customFields.validateCustomFields(
      tenantId,
      'CONTACT',
      dto.customFields,
    );
    const { customFields: _cf, ...rest } = dto;
    return this.prisma.contact.create({
      data: { tenantId, ...rest, customFields, ...actorCreateFields(actorUserId) },
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateContactDto,
    actorUserId?: string,
  ): Promise<Contact> {
    await this.findOne(tenantId, id);
    const customFields =
      dto.customFields !== undefined
        ? await this.customFields.validateCustomFields(tenantId, 'CONTACT', dto.customFields)
        : undefined;
    const { customFields: _cf, ...rest } = dto;
    return this.prisma.contact.update({
      where: { id },
      data: {
        ...rest,
        ...(customFields !== undefined ? { customFields } : {}),
        ...actorUpdateFields(actorUserId),
      },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async listLeads(tenantId: string, contactId: string) {
    await this.findOne(tenantId, contactId);
    return this.prisma.lead.findMany({
      where: { tenantId, contactId, ...notDeleted },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listOpportunities(tenantId: string, contactId: string) {
    await this.findOne(tenantId, contactId);
    return this.prisma.opportunity.findMany({
      where: { tenantId, contactId, ...notDeleted },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listConversations(tenantId: string, contactId: string) {
    await this.findOne(tenantId, contactId);
    return this.prisma.conversation.findMany({
      where: { tenantId, contactId },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
