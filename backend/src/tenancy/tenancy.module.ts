import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantGuard } from './tenant.guard';
import { TenantMiddleware } from './tenant.middleware';
import { ChatwootTenantResolver } from './chatwoot-tenant.resolver';

@Module({
  imports: [PrismaModule],
  providers: [
    TenantGuard,
    TenantMiddleware,
    ChatwootTenantResolver,
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
  exports: [TenantGuard, TenantMiddleware, ChatwootTenantResolver],
})
export class TenancyModule {}
