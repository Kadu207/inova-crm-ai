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
import { OpportunitiesService } from './opportunities.service';
import {
  CreateOpportunityDto,
  MoveOpportunityDto,
  UpdateOpportunityDto,
} from './dto/opportunity.dto';
import { TenantId } from '../common/decorators/tenant.decorator';
import { PlatformApi } from '../common/constants';

@ApiTags('opportunities')
@ApiBearerAuth()
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.opportunitiesService.findAll(tenantId);
  }

  @Post('sla/check')
  @ApiOperation({
    summary: 'Check opportunity stage SLA for current tenant (RN-OPP-03)',
  })
  checkSla(@TenantId() tenantId: string) {
    return this.opportunitiesService.checkSla(tenantId);
  }

  @Post('sla/check-all')
  @PlatformApi()
  @ApiOperation({
    summary:
      'Platform SLA check for all ACTIVE/TRIAL tenants (API_TOKEN, no x-tenant-id; n8n cron)',
  })
  checkSlaAll() {
    return this.opportunitiesService.checkSlaAll();
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.opportunitiesService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateOpportunityDto) {
    return this.opportunitiesService.create(tenantId, dto);
  }

  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateOpportunityDto) {
    return this.opportunitiesService.update(tenantId, id, dto);
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move opportunity to another pipeline stage' })
  move(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: MoveOpportunityDto) {
    return this.opportunitiesService.moveStage(tenantId, id, dto);
  }

  @Post(':id/won')
  @ApiOperation({ summary: 'Mark opportunity as won (RN-OPP-02)' })
  won(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.opportunitiesService.markWon(tenantId, id);
  }

  @Post(':id/lost')
  @ApiOperation({ summary: 'Mark opportunity as lost (RN-OPP-02)' })
  lost(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.opportunitiesService.markLost(tenantId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete opportunity' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.opportunitiesService.remove(tenantId, id);
  }
}
