import { PrismaClient, UserRole, TenantPlan, TenantStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TENANT_SLUG = process.env.SEED_TENANT_SLUG ?? 'demo';
const TENANT_NAME = process.env.SEED_TENANT_NAME ?? 'Inova Demo';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@demo.inovatitech.com.br';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'InovaDemo@2026';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Admin Demo';

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const chatwootAccountId = Number(process.env.SEED_CHATWOOT_ACCOUNT_ID ?? '1');

  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    update: {
      name: TENANT_NAME,
      status: TenantStatus.ACTIVE,
      plan: TenantPlan.STARTER,
      chatwootAccountId: Number.isFinite(chatwootAccountId) ? chatwootAccountId : 1,
    },
    create: {
      slug: TENANT_SLUG,
      name: TENANT_NAME,
      status: TenantStatus.ACTIVE,
      plan: TenantPlan.STARTER,
      chatwootAccountId: Number.isFinite(chatwootAccountId) ? chatwootAccountId : 1,
    },
  });

  const user = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: ADMIN_EMAIL },
    },
    update: {
      name: ADMIN_NAME,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // Default pipeline for demo tenant
  const existingPipeline = await prisma.pipeline.findFirst({
    where: { tenantId: tenant.id, name: 'Funil Comercial' },
  });

  if (!existingPipeline) {
    await prisma.pipeline.create({
      data: {
        tenantId: tenant.id,
        name: 'Funil Comercial',
        isDefault: true,
        stages: {
          create: [
            { tenantId: tenant.id, name: 'Novo', order: 1, probability: 10 },
            { tenantId: tenant.id, name: 'Qualificado', order: 2, probability: 30 },
            { tenantId: tenant.id, name: 'Proposta', order: 3, probability: 60 },
            { tenantId: tenant.id, name: 'Negociação', order: 4, probability: 80 },
            { tenantId: tenant.id, name: 'Ganho', order: 5, probability: 100 },
          ],
        },
      },
    });
  }

  console.log('Seed OK');
  console.log(`  tenant: ${tenant.slug} (${tenant.id})`);
  console.log(`  chatwootAccountId: ${tenant.chatwootAccountId}`);
  console.log(`  admin:  ${user.email}`);
  console.log(`  pass:   ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
