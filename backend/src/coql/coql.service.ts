import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parseCoql, CoqlAst } from '../common/filter-engine/coql-parser';
import { compileFilterToPrisma } from '../common/filter-engine/filter-engine';

@Injectable()
export class CoqlService {
  constructor(private readonly prisma: PrismaService) {}

  async query(tenantId: string, q: string) {
    const ast = parseCoql(q);
    const softDelete = ast.filterModule !== 'company' ? true : true; // all have deletedAt
    const where = compileFilterToPrisma(ast.filterModule, tenantId, ast.filter, softDelete);
    const select = buildSelect(ast);

    switch (ast.filterModule) {
      case 'lead': {
        const [data, count] = await Promise.all([
          this.prisma.lead.findMany({
            where: where as Prisma.LeadWhereInput,
            orderBy: { [ast.sortField]: ast.sortDir },
            take: ast.limit,
            ...(select ? { select: select as Prisma.LeadSelect } : {}),
          }),
          this.prisma.lead.count({ where: where as Prisma.LeadWhereInput }),
        ]);
        return envelope(ast, data, count);
      }
      case 'contact': {
        const [data, count] = await Promise.all([
          this.prisma.contact.findMany({
            where: where as Prisma.ContactWhereInput,
            orderBy: { [ast.sortField]: ast.sortDir },
            take: ast.limit,
            ...(select ? { select: select as Prisma.ContactSelect } : {}),
          }),
          this.prisma.contact.count({ where: where as Prisma.ContactWhereInput }),
        ]);
        return envelope(ast, data, count);
      }
      case 'opportunity': {
        const [data, count] = await Promise.all([
          this.prisma.opportunity.findMany({
            where: where as Prisma.OpportunityWhereInput,
            orderBy: { [ast.sortField]: ast.sortDir },
            take: ast.limit,
            ...(select ? { select: select as Prisma.OpportunitySelect } : {}),
          }),
          this.prisma.opportunity.count({ where: where as Prisma.OpportunityWhereInput }),
        ]);
        return envelope(ast, data, count);
      }
      case 'company': {
        const [data, count] = await Promise.all([
          this.prisma.company.findMany({
            where: where as Prisma.CompanyWhereInput,
            orderBy: { [ast.sortField]: ast.sortDir },
            take: ast.limit,
            ...(select ? { select: select as Prisma.CompanySelect } : {}),
          }),
          this.prisma.company.count({ where: where as Prisma.CompanyWhereInput }),
        ]);
        return envelope(ast, data, count);
      }
      default: {
        const _exhaustive: never = ast.filterModule;
        return _exhaustive;
      }
    }
  }
}

function buildSelect(ast: CoqlAst): Record<string, true> | undefined {
  if (ast.select === 'all_scalars') return undefined;
  const select: Record<string, true> = {};
  for (const field of ast.select) {
    if (field.startsWith('custom.')) {
      select.customFields = true;
      continue;
    }
    select[field] = true;
  }
  // Always include id for clients
  select.id = true;
  return select;
}

function envelope(ast: CoqlAst, data: unknown[], count: number) {
  return {
    data,
    meta: {
      module: ast.module,
      limit: ast.limit,
      count,
      returned: data.length,
    },
  };
}
