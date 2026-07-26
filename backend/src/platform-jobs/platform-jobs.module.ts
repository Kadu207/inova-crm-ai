import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LgpdModule } from '../lgpd/lgpd.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';
import { PlatformJobsService } from './platform-jobs.service';

@Module({
  imports: [ScheduleModule.forRoot(), OpportunitiesModule, LgpdModule],
  providers: [PlatformJobsService],
})
export class PlatformJobsModule {}
