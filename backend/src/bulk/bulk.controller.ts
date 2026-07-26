import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, TenantId } from '../common/decorators/tenant.decorator';
import { JwtPayload } from '../common/constants';
import { resolveActorId } from '../common/audit-fields';
import { BulkService } from './bulk.service';
import { CreateBulkExportDto, CreateBulkImportDto } from './dto/bulk.dto';

@ApiTags('bulk')
@ApiBearerAuth()
@Controller('bulk')
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  @Get('jobs')
  list(@TenantId() tenantId: string) {
    return this.bulkService.findAll(tenantId);
  }

  @Get('jobs/:id')
  get(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.bulkService.findOne(tenantId, id);
  }

  @Get('jobs/:id/download')
  @Header('Content-Type', 'text/csv')
  @ApiOperation({ summary: 'Download export CSV' })
  async download(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.bulkService.getExportCsv(tenantId, id);
  }

  @Post('export')
  export(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: CreateBulkExportDto,
  ) {
    return this.bulkService.startExport(tenantId, dto, resolveActorId(user?.sub));
  }

  @Post('import')
  import(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: CreateBulkImportDto,
  ) {
    return this.bulkService.startImport(tenantId, dto, resolveActorId(user?.sub));
  }
}
