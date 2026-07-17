import { Module } from '@nestjs/common';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
