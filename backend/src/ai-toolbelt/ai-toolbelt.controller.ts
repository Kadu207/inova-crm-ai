import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AiAssistKind, AiToolbeltService } from './ai-toolbelt.service';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Roles } from '../common/constants';

const ASSIST_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.SUPPORT] as const;

@ApiTags('ai-toolbelt')
@ApiBearerAuth()
@Controller('ai')
export class AiToolbeltController {
  constructor(private readonly aiToolbeltService: AiToolbeltService) {}

  @Post('leads/:id/qualify')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES)
  @ApiOperation({ summary: 'AI-assisted lead qualification (Fase 6 stub)' })
  qualifyLead(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.aiToolbeltService.qualifyLead(tenantId, id);
  }

  @Post('suggest-next-step')
  @Roles(...ASSIST_ROLES)
  @ApiOperation({ summary: 'Suggest next CRM action (Spec 034)' })
  suggestNextStep(
    @TenantId() tenantId: string,
    @Body() body: { entityType: string; entityId: string; conversationId?: string },
  ) {
    return this.aiToolbeltService.suggestNextStep(
      tenantId,
      body.entityType,
      body.entityId,
      body.conversationId,
    );
  }

  @Post('conversations/:id/summarize')
  @Roles(...ASSIST_ROLES)
  @ApiOperation({ summary: 'Summarize conversation thread (Spec 034)' })
  summarizeConversation(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.aiToolbeltService.summarizeConversation(tenantId, id);
  }

  @Post('conversations/:id/suggest-reply')
  @Roles(...ASSIST_ROLES)
  @ApiOperation({ summary: 'Suggest reply draft for human agent (Spec 034)' })
  suggestReply(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.aiToolbeltService.suggestReply(tenantId, id);
  }

  @Post('conversations/:id/assist-async')
  @Roles(...ASSIST_ROLES)
  @ApiOperation({ summary: 'Enqueue async AI assist via outbox (Spec 034 P2)' })
  assistAsync(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { kind: AiAssistKind },
  ) {
    return this.aiToolbeltService.requestAssistAsync(tenantId, id, body.kind);
  }

  @Get('suggestions')
  @Roles(...ASSIST_ROLES)
  @ApiOperation({ summary: 'List persisted AI suggestions for a conversation' })
  listSuggestions(@TenantId() tenantId: string, @Query('conversationId') conversationId: string) {
    return this.aiToolbeltService.listSuggestions(tenantId, conversationId);
  }
}
