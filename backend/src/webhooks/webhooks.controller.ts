import { Controller, Post, Body, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../common/constants';
import { WebhooksService, ChatwootWebhookPayload, N8nWebhookPayload } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Post('chatwoot')
  @ApiOperation({ summary: 'Inbound Chatwoot webhook' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  @ApiHeader({ name: 'x-chatwoot-signature', required: false })
  handleChatwoot(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-chatwoot-signature') signature: string | undefined,
    @Headers('x-tenant-id') tenantId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(payload);
    return this.webhooksService.handleChatwoot(
      rawBody,
      signature,
      tenantId,
      payload as unknown as ChatwootWebhookPayload,
    );
  }

  @Public()
  @Post('n8n')
  @ApiOperation({ summary: 'Inbound n8n webhook' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  @ApiHeader({ name: 'x-n8n-signature', required: false })
  handleN8n(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-n8n-signature') signature: string | undefined,
    @Headers('x-tenant-id') tenantId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(payload);
    return this.webhooksService.handleN8n(
      rawBody,
      signature,
      tenantId,
      payload as unknown as N8nWebhookPayload,
    );
  }
}
