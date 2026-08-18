import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto, UpdateProposalDto } from './dto/proposal.dto';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Roles } from '../common/constants';

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
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
  create(@TenantId() tenantId: string, @Body() dto: CreateProposalDto) {
    return this.proposalsService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateProposalDto) {
    return this.proposalsService.update(tenantId, id, dto);
  }
}
