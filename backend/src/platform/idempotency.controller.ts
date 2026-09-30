import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PlatformApi } from '../common/constants';
import { RedisService } from '../redis/redis.service';

class IdempotencyKeyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  eventType?: string;
}

/**
 * Spec 031 — workers claim/release event idempotency via API_TOKEN (PlatformApi).
 */
@Controller('platform/idempotency')
export class IdempotencyController {
  constructor(private readonly redis: RedisService) {}

  @Post('claim')
  @PlatformApi()
  @HttpCode(200)
  async claim(@Body() body: IdempotencyKeyDto) {
    const result = await this.redis.claimIdempotency(body.tenantId, body.idempotencyKey);
    return {
      status: result,
      duplicate: result === 'duplicate',
      eventType: body.eventType ?? null,
    };
  }

  @Post('release')
  @PlatformApi()
  @HttpCode(200)
  async release(@Body() body: IdempotencyKeyDto) {
    await this.redis.releaseIdempotency(body.tenantId, body.idempotencyKey);
    return { status: 'released' };
  }
}
