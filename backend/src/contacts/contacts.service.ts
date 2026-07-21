import { Injectable, NotFoundException } from '@nestjs/common';
import { Contact } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string): Promise<Contact[]> {
    return this.prisma.contact.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async findOne(tenantId: string, id: string): Promise<Contact> {
    const contact = await this.prisma.contact.findFirst({ where: { id, tenantId } });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    return contact;
  }

  create(tenantId: string, dto: CreateContactDto): Promise<Contact> {
    return this.prisma.contact.create({ data: { tenantId, ...dto } });
  }

  async update(tenantId: string, id: string, dto: UpdateContactDto): Promise<Contact> {
    await this.findOne(tenantId, id);
    return this.prisma.contact.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.prisma.contact.delete({ where: { id } });
  }
}
