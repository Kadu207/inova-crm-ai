import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export type LgpdPurgeResult = {
  retentionDays: number;
  cutoff: string;
  purged: {
    companies: number;
    contacts: number;
    leads: number;
    opportunities: number;
    tasks: number;
    products: number;
    services: number;
  };
};

@Injectable()
export class LgpdService {
  private readonly logger = new Logger(LgpdService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  retentionDays(): number {
    const raw = Number(this.config.get('LGPD_PURGE_RETENTION_DAYS', '30'));
    return Number.isFinite(raw) && raw > 0 ? raw : 30;
  }

  /**
   * Hard-delete soft-deleted CRM rows older than retention (platform cron / API_TOKEN).
   * Iterates tenants with withTenant so RLS + tenantId filter apply.
   */
  async purgeExpired(): Promise<LgpdPurgeResult> {
    const days = this.retentionDays();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });
    const totals = {
      companies: 0,
      contacts: 0,
      leads: 0,
      opportunities: 0,
      tasks: 0,
      products: 0,
      services: 0,
    };

    for (const tenant of tenants) {
      const tenantWhere = { tenantId: tenant.id, deletedAt: { lte: cutoff } };
      const counts = await this.prisma.withTenant(tenant.id, async (tx) => {
        const [companies, contacts, leads, opportunities, tasks, products, services] =
          await Promise.all([
            tx.company.deleteMany({ where: tenantWhere }),
            tx.contact.deleteMany({ where: tenantWhere }),
            tx.lead.deleteMany({ where: tenantWhere }),
            tx.opportunity.deleteMany({ where: tenantWhere }),
            tx.task.deleteMany({ where: tenantWhere }),
            tx.product.deleteMany({ where: tenantWhere }),
            tx.service.deleteMany({ where: tenantWhere }),
          ]);
        return {
          companies: companies.count,
          contacts: contacts.count,
          leads: leads.count,
          opportunities: opportunities.count,
          tasks: tasks.count,
          products: products.count,
          services: services.count,
        };
      });

      totals.companies += counts.companies;
      totals.contacts += counts.contacts;
      totals.leads += counts.leads;
      totals.opportunities += counts.opportunities;
      totals.tasks += counts.tasks;
      totals.products += counts.products;
      totals.services += counts.services;
    }

    const result: LgpdPurgeResult = {
      retentionDays: days,
      cutoff: cutoff.toISOString(),
      purged: totals,
    };

    const total = Object.values(result.purged).reduce((a, b) => a + b, 0);
    this.logger.log(
      `LGPD purge: ${total} rows before ${result.cutoff} across ${tenants.length} tenants`,
    );

    return result;
  }
}
