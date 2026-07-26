import { Module } from '@nestjs/common';
import { WebhookSubscriptionsController } from './webhook-subscriptions.controller';
import { WebhookSubscriptionsService } from './webhook-subscriptions.service';

@Module({
  controllers: [WebhookSubscriptionsController],
  providers: [WebhookSubscriptionsService],
  exports: [WebhookSubscriptionsService],
})
export class WebhookSubscriptionsModule {}
