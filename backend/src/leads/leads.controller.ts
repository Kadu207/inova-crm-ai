import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List leads for tenant' })
  findAll(@TenantId() tenantId: string) {
    return this.leadsService.findAll(tenantId);
  }

  @Post('inbound')
  @ApiOperation({ summary: 'Inbound lead from n8n/Chatwoot' })
  inbound(@TenantId() tenantId: string, @Body() dto: InboundLeadDto) {
    return this.leadsService.inboundFromChatwoot(tenantId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by id' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.leadsService.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create lead' })
  create(@TenantId() tenantId: string, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead' })
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(tenantId, id, dto);
  }

  @Post(':id/qualify')
  @ApiOperation({ summary: 'Qualify lead (RN-LEAD-02)' })
  qualify(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: QualifyLeadDto) {
    return this.leadsService.qualify(tenantId, id, dto);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert lead to opportunity' })
  convert(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: ConvertLeadDto) {
    return this.leadsService.convert(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lead' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.leadsService.remove(tenantId, id);
  }
}
