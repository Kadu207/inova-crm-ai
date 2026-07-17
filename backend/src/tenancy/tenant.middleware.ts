import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { TENANT_HEADER } from '../common/constants';

const CHATWOOT_ACCOUNT_HEADER = 'x-chatwoot-account-id';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(
    req: Request & { tenantId?: string },
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const headerTenant = req.headers[TENANT_HEADER] as string | undefined;
    const accountHeader = req.headers[CHATWOOT_ACCOUNT_HEADER] as string | undefined;

    if (accountHeader && /^\d+$/.test(accountHeader)) {
      const accountId = Number(accountHeader);
      const byAccount = await this.prisma.tenant.findFirst({
        where: { chatwootAccountId: accountId },
        select: { id: true },
      });
      if (byAccount) {
        req.tenantId = byAccount.id;
        next();
        return;
      }
    }

    if (headerTenant) {
      const tenant = await this.prisma.tenant.findFirst({
        where: {
          OR: [{ id: headerTenant }, { slug: headerTenant }],
        },
        select: { id: true },
      });
      req.tenantId = tenant?.id ?? headerTenant;
    }
    next();
  }
}
