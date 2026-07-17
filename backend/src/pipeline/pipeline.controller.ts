import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';
import { CreatePipelineDto, CreateStageDto } from './dto/pipeline.dto';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('pipeline')
@ApiBearerAuth()
@Controller('pipelines')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.pipelineService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.pipelineService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreatePipelineDto) {
    return this.pipelineService.create(tenantId, dto);
  }

  @Post(':id/stages')
  addStage(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: CreateStageDto) {
    return this.pipelineService.addStage(tenantId, id, dto);
  }
}
