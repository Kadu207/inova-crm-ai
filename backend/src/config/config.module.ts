import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { TenantConfigService } from './config.service';

@Module({
  controllers: [ConfigController],
  providers: [TenantConfigService],
  exports: [TenantConfigService],
})
export class TenantConfigModule {}
