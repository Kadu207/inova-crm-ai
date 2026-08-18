import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomFieldModule, UserRole } from '@prisma/client';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Roles } from '../common/constants';
import { CreateCustomFieldDto, UpdateCustomFieldDto } from './dto/custom-field.dto';
import { CustomFieldsService } from './custom-fields.service';

@ApiTags('custom-fields')
@ApiBearerAuth()
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly service: CustomFieldsService) {}

  @Get()
  findAll(@TenantId() tenantId: string, @Query('module') module?: CustomFieldModule) {
    return this.service.findAll(tenantId, module);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@TenantId() tenantId: string, @Body() dto: CreateCustomFieldDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateCustomFieldDto) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, id);
  }
}
