import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Roles } from '../common/constants';
import { UserRole } from '@prisma/client';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('invoices')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get()
  @ApiOperation({ summary: 'List invoices' })
  findAll(@TenantId() tenantId: string) {
    return this.financeService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.financeService.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create invoice' })
  create(@TenantId() tenantId: string, @Body() dto: CreateInvoiceDto) {
    return this.financeService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update invoice' })
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.financeService.update(tenantId, id, dto);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Approve invoice (HITL)' })
  approve(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.financeService.approve(tenantId, id);
  }

  @Post(':id/pay')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark invoice as paid' })
  markPaid(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.financeService.markPaid(tenantId, id);
  }
}
