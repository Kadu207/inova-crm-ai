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
import { OpportunitiesService } from './opportunities.service';
import {
  CreateOpportunityDto,
  MoveOpportunityDto,
  UpdateOpportunityDto,
} from './dto/opportunity.dto';
import { CurrentUser, TenantId } from '../common/decorators/tenant.decorator';
import { JwtPayload, PlatformApi } from '../common/constants';
import { resolveActorId } from '../common/audit-fields';
import { ListQueryInput } from '../common/list-query';
import { AdvancedSearchDto } from '../common/dto/advanced-search.dto';

@ApiTags('opportunities')
@ApiBearerAuth()
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: ListQueryInput) {
    return this.opportunitiesService.findAll(tenantId, query);
  }

  @Post('search')
  @ApiOperation({ summary: 'Advanced filter search (AND/OR)' })
  search(@TenantId() tenantId: string, @Body() body: AdvancedSearchDto) {
    return this.opportunitiesService.search(tenantId, body);
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
      'Platform SLA check for all ACTIVE/TRIAL tenants (API_TOKEN; Nest cron + optional n8n backup)',
  })
  checkSlaAll() {
    return this.opportunitiesService.checkSlaAll();
  }

  @Get(':id/tasks')
  listTasks(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.opportunitiesService.listTasks(tenantId, id);
  }

  @Get(':id/proposals')
  listProposals(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.opportunitiesService.listProposals(tenantId, id);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.opportunitiesService.findOne(tenantId, id);
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: CreateOpportunityDto,
  ) {
    return this.opportunitiesService.create(tenantId, dto, resolveActorId(user?.sub));
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: UpdateOpportunityDto,
  ) {
    return this.opportunitiesService.update(tenantId, id, dto, resolveActorId(user?.sub));
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move opportunity to another pipeline stage' })
  move(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: MoveOpportunityDto,
  ) {
    return this.opportunitiesService.moveStage(tenantId, id, dto, resolveActorId(user?.sub));
  }

  @Post(':id/won')
  @ApiOperation({ summary: 'Mark opportunity as won (RN-OPP-02)' })
  won(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    return this.opportunitiesService.markWon(tenantId, id, resolveActorId(user?.sub));
  }

  @Post(':id/lost')
  @ApiOperation({ summary: 'Mark opportunity as lost (RN-OPP-02)' })
  lost(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    return this.opportunitiesService.markLost(tenantId, id, resolveActorId(user?.sub));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete opportunity' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.opportunitiesService.remove(tenantId, id);
  }
}
