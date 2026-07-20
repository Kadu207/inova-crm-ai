import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantGuard } from './tenant.guard';
import { TenantMiddleware } from './tenant.middleware';
import { ChatwootTenantResolver } from './chatwoot-tenant.resolver';
import { TenantRlsInterceptor } from './tenant-rls.interceptor';

@Module({
  imports: [PrismaModule],
  providers: [
    TenantGuard,
    TenantMiddleware,
    ChatwootTenantResolver,
    TenantRlsInterceptor,
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantRlsInterceptor,
    },
  ],
  exports: [TenantGuard, TenantMiddleware, ChatwootTenantResolver],
})
export class TenancyModule {}
