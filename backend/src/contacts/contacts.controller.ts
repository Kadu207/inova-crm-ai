import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.contactsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateContactDto) {
    return this.contactsService.create(tenantId, dto);
  }

  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contactsService.update(tenantId, id, dto);
  }
}
