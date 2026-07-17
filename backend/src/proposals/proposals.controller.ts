import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto, UpdateProposalDto } from './dto/proposal.dto';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('proposals')
@ApiBearerAuth()
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.proposalsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.proposalsService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateProposalDto) {
    return this.proposalsService.create(tenantId, dto);
  }

  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateProposalDto) {
    return this.proposalsService.update(tenantId, id, dto);
  }
}
