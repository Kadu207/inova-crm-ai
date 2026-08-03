import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/constants';
import { TenantId } from '../common/decorators/tenant.decorator';
import { ReportPeriodQueryDto } from './dto/report-period-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('pipeline')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({
    summary: 'Open opportunities count and value by pipeline stage (tenant-scoped)',
  })
  pipeline(@TenantId() tenantId: string, @Query() query: ReportPeriodQueryDto) {
    return this.reportsService.pipeline(tenantId, query);
  }

  @Get('lead-conversion')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({
    summary:
      'Lead conversion in period (CONVERTED status or linked opportunity; tenant-scoped)',
  })
  leadConversion(@TenantId() tenantId: string, @Query() query: ReportPeriodQueryDto) {
    return this.reportsService.leadConversion(tenantId, query);
  }

  @Get('revenue')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({
    summary: 'Forecast (OPEN) vs realized (WON) opportunity value in period',
  })
  revenue(@TenantId() tenantId: string, @Query() query: ReportPeriodQueryDto) {
    return this.reportsService.revenue(tenantId, query);
  }

  @Get('sla')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  @ApiOperation({
    summary:
      'SLA indicators (conversations + opportunity breaches); meta.partial when first-response unavailable',
  })
  sla(@TenantId() tenantId: string, @Query() query: ReportPeriodQueryDto) {
    return this.reportsService.sla(tenantId, query);
  }

  @Get(':kind/export.csv')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({ summary: 'Export report kind as CSV (pipeline|lead-conversion|revenue|sla)' })
  exportCsv(
    @TenantId() tenantId: string,
    @Param('kind') kind: string,
    @Query() query: ReportPeriodQueryDto,
  ) {
    return this.reportsService.exportCsv(tenantId, kind, query);
  }
}
