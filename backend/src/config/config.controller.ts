import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TenantConfigService } from './config.service';
import { SetConfigDto } from './dto/config.dto';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Roles } from '../common/constants';

@ApiTags('config')
@ApiBearerAuth()
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: TenantConfigService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@TenantId() tenantId: string) {
    return this.configService.findAll(tenantId);
  }

  @Get(':key')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  get(@TenantId() tenantId: string, @Param('key') key: string) {
    return this.configService.get(tenantId, key);
  }

  @Put()
  @Roles(UserRole.ADMIN)
  set(@TenantId() tenantId: string, @Body() dto: SetConfigDto) {
    return this.configService.set(tenantId, dto);
  }
}
