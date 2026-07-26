import { Module } from '@nestjs/common';
import { CoqlController } from './coql.controller';
import { CoqlService } from './coql.service';

@Module({
  controllers: [CoqlController],
  providers: [CoqlService],
})
export class CoqlModule {}
