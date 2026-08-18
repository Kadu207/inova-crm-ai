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
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { CurrentUser, TenantId } from '../common/decorators/tenant.decorator';
import { JwtPayload, Roles } from '../common/constants';
import { resolveActorId } from '../common/audit-fields';
import { ListQueryInput } from '../common/list-query';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@TenantId() tenantId: string, @Query() query: ListQueryInput) {
    return this.tasksService.findAll(tenantId, query);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.tasksService.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.SUPPORT)
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(tenantId, dto, resolveActorId(user?.sub));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.SUPPORT)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload | undefined,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(tenantId, id, dto, resolveActorId(user?.sub));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.SUPPORT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.tasksService.remove(tenantId, id);
  }
}
