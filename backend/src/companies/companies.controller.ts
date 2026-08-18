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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { CurrentUser, TenantId } from '../common/decorators/tenant.decorator';
import { JwtPayload, Roles } from '../common/constants';
import { resolveActorId } from '../common/audit-fields';
import { ListQueryInput } from '../common/list-query';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: ListQueryInput) {
    return this.companiesService.findAll(tenantId, query);
  }

  @Get(':id/contacts')
  @ApiOperation({ summary: 'Related contacts of company' })
  listContacts(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.companiesService.listContacts(tenantId, id);
  }

  @Get(':id/leads')
  @ApiOperation({ summary: 'Related leads of company' })
  listLeads(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.companiesService.listLeads(tenantId, id);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.companiesService.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(tenantId, dto, resolveActorId(user?.sub));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(tenantId, id, dto, resolveActorId(user?.sub));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.companiesService.remove(tenantId, id);
  }
}
