import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Spec 031 — PostgreSQL full-text search for list `?q=`.
 * Uses plainto_tsquery (no user tsquery operators) + expression GIN indexes.
 */

export type FtsEntity =
  'contact' | 'lead' | 'company' | 'product' | 'service' | 'task' | 'opportunity';

type FtsConfig = {
  table: string;
  /** SQL expression for to_tsvector document (trusted, not user input). */
  documentSql: string;
};

const FTS_DOC: Record<FtsEntity, FtsConfig> = {
  contact: {
    table: 'contacts',
    documentSql: `coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, '')`,
  },
  lead: {
    table: 'leads',
    documentSql: `coalesce(title, '') || ' ' || coalesce(notes, '')`,
  },
  company: {
    table: 'companies',
    documentSql: `coalesce(name, '') || ' ' || coalesce(document, '')`,
  },
  product: {
    table: 'products',
    documentSql: `coalesce(name, '') || ' ' || coalesce(sku, '') || ' ' || coalesce(description, '')`,
  },
  service: {
    table: 'services',
    documentSql: `coalesce(name, '') || ' ' || coalesce(code, '') || ' ' || coalesce(description, '')`,
  },
  task: {
    table: 'tasks',
    documentSql: `coalesce(title, '') || ' ' || coalesce(description, '')`,
  },
  opportunity: {
    table: 'opportunities',
    documentSql: `coalesce(title, '')`,
  },
};

/** Strip control chars / LIKE wildcards; keep letters, numbers, @ . + - spaces. */
export function sanitizeFtsQuery(raw: string): string {
  return raw
    .normalize('NFKC')
    .trim()
    .slice(0, 200)
    .replace(/[%_]/g, ' ')
    .replace(/[^\p{L}\p{N}\s@.+-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type FtsPageResult = {
  ids: string[];
  total: number;
};

export function orderByIds<T extends { id: string }>(rows: T[], ids: string[]): T[] {
  const map = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => map.get(id)).filter((r): r is T => r !== undefined);
}

/**
 * Ranked FTS page. Empty sanitized query → null (caller skips FTS).
 * Runs inside withTenant so RLS app.tenant_id is set.
 */
export async function ftsSearchPage(
  prisma: PrismaService,
  entity: FtsEntity,
  tenantId: string,
  rawQuery: string,
  skip: number,
  take: number,
): Promise<FtsPageResult | null> {
  const q = sanitizeFtsQuery(rawQuery);
  if (!q) {
    return null;
  }

  const cfg = FTS_DOC[entity];
  const table = Prisma.raw(`"${cfg.table}"`);
  const doc = Prisma.raw(cfg.documentSql);

  return prisma.withTenant(tenantId, async (tx) => {
    const rows = (await tx.$queryRaw`
      SELECT id
      FROM ${table}
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND to_tsvector('portuguese', ${doc})
            @@ plainto_tsquery('portuguese', ${q})
      ORDER BY ts_rank(
        to_tsvector('portuguese', ${doc}),
        plainto_tsquery('portuguese', ${q})
      ) DESC,
      created_at DESC
      LIMIT ${take} OFFSET ${skip}
    `) as Array<{ id: string }>;

    const countRows = (await tx.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM ${table}
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND to_tsvector('portuguese', ${doc})
            @@ plainto_tsquery('portuguese', ${q})
    `) as Array<{ count: bigint }>;

    return {
      ids: rows.map((r) => r.id),
      total: Number(countRows[0]?.count ?? 0),
    };
  });
}
