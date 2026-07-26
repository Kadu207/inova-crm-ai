import { Module, forwardRef } from '@nestjs/common';
import { EventsService } from './events.service';
import { WebhookSubscriptionsModule } from '../webhook-subscriptions/webhook-subscriptions.module';

@Module({
  imports: [forwardRef(() => WebhookSubscriptionsModule)],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
