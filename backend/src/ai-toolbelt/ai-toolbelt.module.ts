import { Module } from '@nestjs/common';
import { AiToolbeltController } from './ai-toolbelt.controller';
import { AiToolbeltService } from './ai-toolbelt.service';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [LeadsModule],
  controllers: [AiToolbeltController],
  providers: [AiToolbeltService],
  exports: [AiToolbeltService],
})
export class AiToolbeltModule {}
