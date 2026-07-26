import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { EventsModule } from '../events/events.module';
import { CustomFieldsModule } from '../custom-fields/custom-fields.module';

@Module({
  imports: [EventsModule, CustomFieldsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
