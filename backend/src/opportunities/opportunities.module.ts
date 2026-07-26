import { Module } from '@nestjs/common';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';
import { EventsModule } from '../events/events.module';
import { BlueprintModule } from '../blueprint/blueprint.module';

@Module({
  imports: [EventsModule, BlueprintModule],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
