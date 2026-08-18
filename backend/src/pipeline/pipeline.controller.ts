import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PipelineService } from './pipeline.service';
import { CreatePipelineDto, CreateStageDto } from './dto/pipeline.dto';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Roles } from '../common/constants';

@ApiTags('pipeline')
@ApiBearerAuth()
@Controller('pipelines')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.pipelineService.findAll(tenantId);
  }

  @Get('default')
  findDefault(@TenantId() tenantId: string) {
    return this.pipelineService.findDefault(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.pipelineService.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@TenantId() tenantId: string, @Body() dto: CreatePipelineDto) {
    return this.pipelineService.create(tenantId, dto);
  }

  @Post(':id/stages')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  addStage(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: CreateStageDto) {
    return this.pipelineService.addStage(tenantId, id, dto);
  }
}
