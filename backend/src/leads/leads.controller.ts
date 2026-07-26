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
import { LeadsService } from './leads.service';
import {
  ConvertLeadDto,
  CreateLeadDto,
  InboundLeadDto,
  QualifyLeadDto,
  UpdateLeadDto,
} from './dto/lead.dto';
import { CurrentUser, TenantId } from '../common/decorators/tenant.decorator';
import { JwtPayload } from '../common/constants';
import { resolveActorId } from '../common/audit-fields';
import { ListQueryInput } from '../common/list-query';
import { AdvancedSearchDto } from '../common/dto/advanced-search.dto';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List leads for tenant' })
  findAll(@TenantId() tenantId: string, @Query() query: ListQueryInput) {
    return this.leadsService.findAll(tenantId, query);
  }

  @Post('search')
  @ApiOperation({ summary: 'Advanced filter search (AND/OR + custom fields)' })
  search(@TenantId() tenantId: string, @Body() body: AdvancedSearchDto) {
    return this.leadsService.search(tenantId, body);
  }

  @Post('inbound')
  @ApiOperation({ summary: 'Inbound lead from n8n/Chatwoot' })
  inbound(@TenantId() tenantId: string, @Body() dto: InboundLeadDto) {
    return this.leadsService.inboundFromChatwoot(tenantId, dto);
  }

  @Get(':id/opportunities')
  listOpportunities(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.leadsService.listOpportunities(tenantId, id);
  }

  @Get(':id/conversations')
  listConversations(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.leadsService.listConversations(tenantId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by id' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.leadsService.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create lead' })
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadsService.create(tenantId, dto, resolveActorId(user?.sub));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(tenantId, id, dto, resolveActorId(user?.sub));
  }

  @Post(':id/qualify')
  @ApiOperation({ summary: 'Qualify lead (RN-LEAD-02)' })
  qualify(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: QualifyLeadDto,
  ) {
    return this.leadsService.qualify(tenantId, id, dto, resolveActorId(user?.sub));
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert lead to opportunity' })
  convert(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: ConvertLeadDto,
  ) {
    return this.leadsService.convert(tenantId, id, dto, resolveActorId(user?.sub));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lead' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.leadsService.remove(tenantId, id);
  }
}
