import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SaasService } from './saas.service';
import { OnboardTenantDto, UpdateQuotasDto, UpdateTenantStatusDto } from './dto/saas.dto';
import { Roles } from '../common/constants';

@ApiTags('saas')
@ApiBearerAuth()
@Controller('saas/tenants')
export class SaasController {
  constructor(private readonly saasService: SaasService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all tenants (Fase 7 stub)' })
  list() {
    return this.saasService.listTenants();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.saasService.findTenant(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Onboard new tenant (Fase 7 stub)' })
  onboard(@Body() dto: OnboardTenantDto) {
    return this.saasService.onboard(dto);
  }

  @Patch(':id/quotas')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update tenant quotas (Fase 7 prep)' })
  updateQuotas(@Param('id') id: string, @Body() dto: UpdateQuotasDto) {
    return this.saasService.updateQuotas(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTenantStatusDto) {
    return this.saasService.updateStatus(id, dto);
  }
}
