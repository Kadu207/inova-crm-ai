import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { PrismaClient } from '@prisma/client';
import { getRequestTenantId, runWithTenant } from './tenant-context';
import { TenantRlsInterceptor } from './tenant-rls.interceptor';

describe('tenant-context ALS', () => {
  it('exposes tenantId only inside runWithTenant', () => {
    expect(getRequestTenantId()).toBeUndefined();
    const value = runWithTenant('tenant-a', () => getRequestTenantId());
    expect(value).toBe('tenant-a');
    expect(getRequestTenantId()).toBeUndefined();
  });
});

describe('TenantRlsInterceptor', () => {
  const interceptor = new TenantRlsInterceptor();

  function mockContext(tenantId?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ tenantId }),
      }),
    } as ExecutionContext;
  }

  it('propagates ALS through Observable handlers', (done) => {
    const alsHandler: CallHandler = {
      handle: () =>
        new Observable<string | undefined>((subscriber) => {
          subscriber.next(getRequestTenantId());
          subscriber.complete();
        }),
    };

    interceptor.intercept(mockContext('t-99'), alsHandler).subscribe({
      next: (id) => {
        expect(id).toBe('t-99');
      },
      complete: () => done(),
      error: done,
    });
  });

  it('passes through when tenantId missing', (done) => {
    const handler: CallHandler = {
      handle: () => of('ok'),
    };
    interceptor.intercept(mockContext(undefined), handler).subscribe({
      next: (v) => expect(v).toBe('ok'),
      complete: () => done(),
      error: done,
    });
  });

  it('forwards errors', (done) => {
    const handler: CallHandler = {
      handle: () => throwError(() => new Error('boom')),
    };
    interceptor.intercept(mockContext('t1'), handler).subscribe({
      next: () => done(new Error('should not next')),
      error: (err: Error) => {
        expect(err.message).toBe('boom');
        done();
      },
    });
  });
});

describe('RLS migration SQL', () => {
  const sql = readFileSync(
    join(__dirname, '../../prisma/migrations/20260720050000_tenant_rls/migration.sql'),
    'utf8',
  );

  const tables = [
    'users',
    'tenant_configs',
    'companies',
    'contacts',
    'leads',
    'pipelines',
    'pipeline_stages',
    'opportunities',
    'tasks',
    'products',
    'services',
    'conversations',
    'audit_logs',
    'proposals',
    'contracts',
    'invoices',
    'payments',
    'outbox_events',
  ];

  it('enables and forces RLS on all domain tables', () => {
    for (const table of tables) {
      expect(sql).toContain(`'${table}'`);
    }
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('FORCE ROW LEVEL SECURITY');
    expect(sql).toContain('app.tenant_id');
    expect(sql).not.toMatch(/ARRAY\[[^\]]*'tenants'/);
  });
});

const isolationDescribe = process.env.RUN_RLS_INTEGRATION === '1' ? describe : describe.skip;

isolationDescribe('RLS isolation (integration)', () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('tenant A cannot read tenant B leads without matching app.tenant_id', async () => {
    const tenantA = await prisma.tenant.create({
      data: { slug: `rls-a-${Date.now()}`, name: 'RLS A' },
    });
    const tenantB = await prisma.tenant.create({
      data: { slug: `rls-b-${Date.now()}`, name: 'RLS B' },
    });

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantA.id}, true)`;
      await tx.lead.create({
        data: { tenantId: tenantA.id, title: 'Lead A', status: 'NEW', source: 'MANUAL' },
      });
    });

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantB.id}, true)`;
      await tx.lead.create({
        data: { tenantId: tenantB.id, title: 'Lead B', status: 'NEW', source: 'MANUAL' },
      });
    });

    const seenAsA = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantA.id}, true)`;
      return tx.$queryRaw<{ title: string }[]>`SELECT title FROM leads ORDER BY title`;
    });

    const seenAsB = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantB.id}, true)`;
      return tx.$queryRaw<{ title: string }[]>`SELECT title FROM leads ORDER BY title`;
    });

    expect(seenAsA.map((r) => r.title)).toEqual(['Lead A']);
    expect(seenAsB.map((r) => r.title)).toEqual(['Lead B']);

    // Cleanup under each tenant context
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantA.id}, true)`;
      await tx.lead.deleteMany({ where: { tenantId: tenantA.id } });
    });
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantB.id}, true)`;
      await tx.lead.deleteMany({ where: { tenantId: tenantB.id } });
    });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } });
  });
});
