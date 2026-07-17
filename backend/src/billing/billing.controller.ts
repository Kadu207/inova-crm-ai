import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BillingService } from './billing.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Roles } from '../common/constants';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('payments')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findAll(@TenantId() tenantId: string) {
    return this.billingService.findAll(tenantId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.billingService.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@TenantId() tenantId: string, @Body() dto: CreatePaymentDto) {
    return this.billingService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.billingService.update(tenantId, id, dto);
  }
}
