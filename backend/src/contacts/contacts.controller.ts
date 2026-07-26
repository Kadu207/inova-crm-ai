import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import { CurrentUser, TenantId } from '../common/decorators/tenant.decorator';
import { JwtPayload } from '../common/constants';
import { resolveActorId } from '../common/audit-fields';
import { ListQueryInput } from '../common/list-query';
import { AdvancedSearchDto } from '../common/dto/advanced-search.dto';

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: ListQueryInput) {
    return this.contactsService.findAll(tenantId, query);
  }

  @Post('search')
  @ApiOperation({ summary: 'Advanced filter search (AND/OR + custom fields)' })
  search(@TenantId() tenantId: string, @Body() body: AdvancedSearchDto) {
    return this.contactsService.search(tenantId, body);
  }

  @Get(':id/leads')
  listLeads(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.listLeads(tenantId, id);
  }

  @Get(':id/opportunities')
  listOpportunities(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.listOpportunities(tenantId, id);
  }

  @Get(':id/conversations')
  listConversations(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.listConversations(tenantId, id);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.findOne(tenantId, id);
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.create(tenantId, dto, resolveActorId(user?.sub));
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(tenantId, id, dto, resolveActorId(user?.sub));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete contact' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contactsService.remove(tenantId, id);
  }
}
