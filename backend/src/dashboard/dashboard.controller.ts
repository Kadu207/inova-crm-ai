import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TenantId } from '../common/decorators/tenant.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Tenant KPI summary for Ember Studio dashboard' })
  getSummary(@TenantId() tenantId: string) {
    return this.dashboardService.getSummary(tenantId);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Recent tenant activity timeline' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getActivity(@TenantId() tenantId: string, @Query('limit') limit?: string) {
    const parsed = limit != null ? Number.parseInt(limit, 10) : 20;
    return this.dashboardService.getActivity(tenantId, Number.isFinite(parsed) ? parsed : 20);
  }
}
