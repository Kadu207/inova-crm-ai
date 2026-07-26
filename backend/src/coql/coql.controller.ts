import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/constants';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CoqlService } from './coql.service';
import { CoqlQueryDto } from './dto/coql.dto';

@ApiTags('coql')
@ApiBearerAuth()
@Controller('coql')
export class CoqlController {
  constructor(private readonly coqlService: CoqlService) {}

  @Post('query')
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'COQL read-only query (admin JWT or API_TOKEN + x-tenant-id)',
  })
  query(@TenantId() tenantId: string, @Body() dto: CoqlQueryDto) {
    return this.coqlService.query(tenantId, dto.q);
  }
}
