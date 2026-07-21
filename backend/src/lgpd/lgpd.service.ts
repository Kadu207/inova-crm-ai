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
   * Result returned to caller/n8n (no outbox — no platform tenant FK).
   */
  async purgeExpired(): Promise<LgpdPurgeResult> {
    const days = this.retentionDays();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where = { deletedAt: { lte: cutoff } };

    const [companies, contacts, leads, opportunities, tasks, products, services] =
      await Promise.all([
        this.prisma.company.deleteMany({ where }),
        this.prisma.contact.deleteMany({ where }),
        this.prisma.lead.deleteMany({ where }),
        this.prisma.opportunity.deleteMany({ where }),
        this.prisma.task.deleteMany({ where }),
        this.prisma.product.deleteMany({ where }),
        this.prisma.service.deleteMany({ where }),
      ]);

    const result: LgpdPurgeResult = {
      retentionDays: days,
      cutoff: cutoff.toISOString(),
      purged: {
        companies: companies.count,
        contacts: contacts.count,
        leads: leads.count,
        opportunities: opportunities.count,
        tasks: tasks.count,
        products: products.count,
        services: services.count,
      },
    };

    const total = Object.values(result.purged).reduce((a, b) => a + b, 0);
    this.logger.log(`LGPD purge: ${total} rows before ${result.cutoff}`);

    return result;
  }
}
