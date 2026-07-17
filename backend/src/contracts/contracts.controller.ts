import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto } from './dto/contract.dto';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.contractsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.contractsService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateContractDto) {
    return this.contractsService.create(tenantId, dto);
  }

  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.contractsService.update(tenantId, id, dto);
  }
}
