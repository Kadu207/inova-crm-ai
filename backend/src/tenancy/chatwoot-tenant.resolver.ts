import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatwootTenantResolver {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve CRM tenant from Chatwoot account_id (preferred) or explicit tenant hint (id/slug).
   */
  async resolve(opts: {
    chatwootAccountId?: number | null;
    tenantHint?: string | null;
  }): Promise<string> {
    if (opts.chatwootAccountId != null) {
      const byAccount = await this.prisma.tenant.findFirst({
        where: { chatwootAccountId: opts.chatwootAccountId },
        select: { id: true },
      });
      if (byAccount) {
        return byAccount.id;
      }
    }

    if (opts.tenantHint) {
      const byHint = await this.prisma.tenant.findFirst({
        where: {
          OR: [{ id: opts.tenantHint }, { slug: opts.tenantHint }],
        },
        select: { id: true },
      });
      if (byHint) {
        return byHint.id;
      }
    }

    if (opts.chatwootAccountId != null) {
      throw new NotFoundException(
        `No tenant mapped to Chatwoot account_id=${opts.chatwootAccountId}`,
      );
    }

    throw new BadRequestException(
      'Unable to resolve tenant: provide mapped chatwoot accountId or x-tenant-id',
    );
  }
}
