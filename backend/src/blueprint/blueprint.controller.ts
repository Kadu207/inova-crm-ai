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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/constants';
import { TenantId } from '../common/decorators/tenant.decorator';
import { BlueprintService } from './blueprint.service';
import { CreateBlueprintTransitionDto, UpdateBlueprintTransitionDto } from './dto/blueprint.dto';

@ApiTags('blueprint')
@ApiBearerAuth()
@Controller('pipelines/:pipelineId/blueprint/transitions')
export class BlueprintController {
  constructor(private readonly blueprintService: BlueprintService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List blueprint transitions for pipeline' })
  list(@TenantId() tenantId: string, @Param('pipelineId') pipelineId: string) {
    return this.blueprintService.listTransitions(tenantId, pipelineId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create blueprint transition' })
  create(
    @TenantId() tenantId: string,
    @Param('pipelineId') pipelineId: string,
    @Body() dto: CreateBlueprintTransitionDto,
  ) {
    return this.blueprintService.createTransition(tenantId, pipelineId, dto);
  }

  @Patch(':transitionId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update blueprint transition required fields' })
  update(
    @TenantId() tenantId: string,
    @Param('pipelineId') pipelineId: string,
    @Param('transitionId') transitionId: string,
    @Body() dto: UpdateBlueprintTransitionDto,
  ) {
    return this.blueprintService.updateTransition(tenantId, pipelineId, transitionId, dto);
  }

  @Delete(':transitionId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete blueprint transition' })
  async remove(
    @TenantId() tenantId: string,
    @Param('pipelineId') pipelineId: string,
    @Param('transitionId') transitionId: string,
  ): Promise<void> {
    await this.blueprintService.deleteTransition(tenantId, pipelineId, transitionId);
  }
}
