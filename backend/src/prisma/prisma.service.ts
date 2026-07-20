import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { getRequestTenantId } from '../tenancy/tenant-context';

function modelDelegateKey(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

type DelegateMap = Record<string, Record<string, (args: unknown) => Promise<unknown>>>;

const baseClient = new PrismaClient();

const extendedClient = baseClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args }) {
        const tenantId = getRequestTenantId();
        const key = modelDelegateKey(model);

        if (!tenantId) {
          return (baseClient as unknown as DelegateMap)[key][operation](args);
        }

        return baseClient.$transaction(async (tx) => {
          await tx.$executeRaw`
            SELECT set_config('app.tenant_id', ${tenantId}, true)
          `;
          return (tx as unknown as DelegateMap)[key][operation](args);
        });
      },
    },
  },
});

export type TenantAwarePrisma = typeof extendedClient;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client = extendedClient;

  async onModuleInit(): Promise<void> {
    await baseClient.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await baseClient.$disconnect();
  }

  /**
   * Run work inside one DB transaction with app.tenant_id set (RLS).
   * Prefer this for auth/public flows — does not rely on ALS.
   */
  withTenant<T>(tenantId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return baseClient.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT set_config('app.tenant_id', ${tenantId}, true)
      `;
      return fn(tx);
    });
  }

  async setTenantIdOn(tx: Prisma.TransactionClient, tenantId: string): Promise<void> {
    await tx.$executeRaw`
      SELECT set_config('app.tenant_id', ${tenantId}, true)
    `;
  }

  get tenant() {
    return this.client.tenant;
  }
  get user() {
    return this.client.user;
  }
  get tenantConfig() {
    return this.client.tenantConfig;
  }
  get company() {
    return this.client.company;
  }
  get contact() {
    return this.client.contact;
  }
  get lead() {
    return this.client.lead;
  }
  get pipeline() {
    return this.client.pipeline;
  }
  get pipelineStage() {
    return this.client.pipelineStage;
  }
  get opportunity() {
    return this.client.opportunity;
  }
  get task() {
    return this.client.task;
  }
  get product() {
    return this.client.product;
  }
  get service() {
    return this.client.service;
  }
  get conversation() {
    return this.client.conversation;
  }
  get auditLog() {
    return this.client.auditLog;
  }
  get proposal() {
    return this.client.proposal;
  }
  get contract() {
    return this.client.contract;
  }
  get invoice() {
    return this.client.invoice;
  }
  get payment() {
    return this.client.payment;
  }
  get outboxEvent() {
    return this.client.outboxEvent;
  }

  $transaction(...args: Parameters<typeof baseClient.$transaction>) {
    return (
      baseClient.$transaction as (
        ...a: Parameters<typeof baseClient.$transaction>
      ) => ReturnType<typeof baseClient.$transaction>
    )(...args);
  }

  $executeRaw(...args: Parameters<typeof baseClient.$executeRaw>) {
    return (
      baseClient.$executeRaw as (
        ...a: Parameters<typeof baseClient.$executeRaw>
      ) => ReturnType<typeof baseClient.$executeRaw>
    )(...args);
  }

  $queryRaw(...args: Parameters<typeof baseClient.$queryRaw>) {
    return (
      baseClient.$queryRaw as (
        ...a: Parameters<typeof baseClient.$queryRaw>
      ) => ReturnType<typeof baseClient.$queryRaw>
    )(...args);
  }

  $executeRawUnsafe(...args: Parameters<PrismaClient['$executeRawUnsafe']>) {
    return baseClient.$executeRawUnsafe(...args);
  }

  $queryRawUnsafe(...args: Parameters<PrismaClient['$queryRawUnsafe']>) {
    return baseClient.$queryRawUnsafe(...args);
  }
}
