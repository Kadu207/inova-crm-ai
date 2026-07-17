import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiToolbeltService } from './ai-toolbelt.service';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('ai-toolbelt')
@ApiBearerAuth()
@Controller('ai')
export class AiToolbeltController {
  constructor(private readonly aiToolbeltService: AiToolbeltService) {}

  @Post('leads/:id/qualify')
  @ApiOperation({ summary: 'AI-assisted lead qualification (Fase 6 stub)' })
  qualifyLead(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.aiToolbeltService.qualifyLead(tenantId, id);
  }

  @Post('suggest-next-step')
  @ApiOperation({ summary: 'Suggest next CRM action (Fase 6 stub)' })
  suggestNextStep(@Body() body: { entityType: string; entityId: string }) {
    return this.aiToolbeltService.suggestNextStep(body.entityType, body.entityId);
  }
}
