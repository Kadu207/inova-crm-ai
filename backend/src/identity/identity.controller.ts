import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IdentityService } from './identity.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Roles } from '../common/constants';

@ApiTags('identity')
@ApiBearerAuth()
@Controller('users')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findAll(@TenantId() tenantId: string) {
    return this.identityService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.identityService.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create user' })
  create(@TenantId() tenantId: string, @Body() dto: CreateUserDto) {
    return this.identityService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.identityService.update(tenantId, id, dto);
  }
}
