import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuditService } from './audit.service';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Roles } from '../common/constants';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findAll(@TenantId() tenantId: string) {
    return this.auditService.findAll(tenantId);
  }
}
