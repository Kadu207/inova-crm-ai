import { Module } from '@nestjs/common';
import { AiToolbeltController } from './ai-toolbelt.controller';
import { AiToolbeltService } from './ai-toolbelt.service';
import { AiCrmClient } from './ai-crm.client';
import { LeadsModule } from '../leads/leads.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [LeadsModule, ConversationsModule, EventsModule],
  controllers: [AiToolbeltController],
  providers: [AiToolbeltService, AiCrmClient],
  exports: [AiToolbeltService],
})
export class AiToolbeltModule {}
