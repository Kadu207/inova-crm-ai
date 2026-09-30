import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { IdempotencyController } from './idempotency.controller';

@Module({
  imports: [RedisModule],
  controllers: [IdempotencyController],
})
export class PlatformModule {}
