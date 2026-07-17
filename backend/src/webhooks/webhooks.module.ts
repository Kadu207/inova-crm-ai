import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { AuditModule } from '../audit/audit.module';
import { LeadsModule } from '../leads/leads.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [AuditModule, LeadsModule, ConversationsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
