import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ConversationsService } from './conversations.service';
import {
  CreateConversationDto,
  SyncConversationDto,
  UpdateConversationDto,
} from './dto/conversation.dto';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Roles } from '../common/constants';

@ApiTags('conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.conversationsService.findAll(tenantId);
  }

  @Post('sync')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.SUPPORT)
  @ApiOperation({ summary: 'Sync conversation from n8n/Chatwoot' })
  sync(@TenantId() tenantId: string, @Body() dto: SyncConversationDto) {
    return this.conversationsService.syncFromChatwoot(tenantId, dto);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.conversationsService.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.SUPPORT)
  create(@TenantId() tenantId: string, @Body() dto: CreateConversationDto) {
    return this.conversationsService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.SUPPORT)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(tenantId, id, dto);
  }
}
