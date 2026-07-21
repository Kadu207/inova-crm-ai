import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { TenantMiddleware } from './tenancy/tenant.middleware';
import { IdentityModule } from './identity/identity.module';
import { CompaniesModule } from './companies/companies.module';
import { ContactsModule } from './contacts/contacts.module';
import { LeadsModule } from './leads/leads.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { TasksModule } from './tasks/tasks.module';
import { ProductsModule } from './products/products.module';
import { ServicesModule } from './services/services.module';
import { ConversationsModule } from './conversations/conversations.module';
import { TenantConfigModule } from './config/config.module';
import { AuditModule } from './audit/audit.module';
import { ProposalsModule } from './proposals/proposals.module';
import { ContractsModule } from './contracts/contracts.module';
import { FinanceModule } from './finance/finance.module';
import { BillingModule } from './billing/billing.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { EventsModule } from './events/events.module';
import { AiToolbeltModule } from './ai-toolbelt/ai-toolbelt.module';
import { SaasModule } from './saas/saas.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    TenancyModule,
    IdentityModule,
    CompaniesModule,
    ContactsModule,
    LeadsModule,
    PipelineModule,
    OpportunitiesModule,
    TasksModule,
    ProductsModule,
    ServicesModule,
    ConversationsModule,
    TenantConfigModule,
    AuditModule,
    ProposalsModule,
    ContractsModule,
    FinanceModule,
    BillingModule,
    WebhooksModule,
    EventsModule,
    AiToolbeltModule,
    SaasModule,
    DashboardModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
