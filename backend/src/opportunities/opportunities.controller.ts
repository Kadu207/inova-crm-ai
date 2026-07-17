import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto, UpdateOpportunityDto } from './dto/opportunity.dto';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('opportunities')
@ApiBearerAuth()
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.opportunitiesService.findAll(tenantId);
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
}
