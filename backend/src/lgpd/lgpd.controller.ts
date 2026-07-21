import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlatformApi } from '../common/constants';
import { LgpdService } from './lgpd.service';

@ApiTags('lgpd')
@ApiBearerAuth()
@Controller('lgpd')
export class LgpdController {
  constructor(private readonly lgpdService: LgpdService) {}

  @Post('purge')
  @PlatformApi()
  @ApiOperation({
    summary:
      'Hard-delete soft-deleted CRM rows past retention (API_TOKEN; n8n/cron; no x-tenant-id)',
  })
  purge() {
    return this.lgpdService.purgeExpired();
  }
}
