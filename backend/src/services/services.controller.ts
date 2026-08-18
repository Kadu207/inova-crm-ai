import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { CurrentUser, TenantId } from '../common/decorators/tenant.decorator';
import { JwtPayload, Roles } from '../common/constants';
import { resolveActorId } from '../common/audit-fields';
import { ListQueryInput } from '../common/list-query';

@ApiTags('services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: ListQueryInput) {
    return this.servicesService.findAll(tenantId, query);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.servicesService.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: CreateServiceDto,
  ) {
    return this.servicesService.create(tenantId, dto, resolveActorId(user?.sub));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(tenantId, id, dto, resolveActorId(user?.sub));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete service' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.servicesService.remove(tenantId, id);
  }
}
