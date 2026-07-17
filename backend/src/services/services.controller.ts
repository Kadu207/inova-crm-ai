import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.servicesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.servicesService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(tenantId, dto);
  }

  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(tenantId, id, dto);
  }
}
