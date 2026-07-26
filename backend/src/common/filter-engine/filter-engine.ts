import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const FILTER_OPS = [
  'eq',
  'neq',
  'contains',
  'in',
  'gt',
  'gte',
  'lt',
  'lte',
  'is_null',
] as const;

export type FilterOp = (typeof FILTER_OPS)[number];

export type FilterLeaf = {
  field: string;
  op: FilterOp;
  value?: unknown;
};

export type FilterNode = { and: FilterNode[] } | { or: FilterNode[] } | FilterLeaf;

export type FilterModule = 'lead' | 'contact' | 'opportunity' | 'company';

const MAX_DEPTH = 3;

const SCALAR_FIELDS: Record<FilterModule, ReadonlySet<string>> = {
  lead: new Set([
    'id',
    'title',
    'status',
    'source',
    'score',
    'notes',
    'assignedToId',
    'createdAt',
    'updatedAt',
  ]),
  contact: new Set(['id', 'name', 'email', 'phone', 'companyId', 'createdAt', 'updatedAt']),
  opportunity: new Set([
    'id',
    'title',
    'status',
    'pipelineId',
    'stageId',
    'leadId',
    'contactId',
    'assignedToId',
    'value',
    'createdAt',
    'updatedAt',
  ]),
  company: new Set(['id', 'name', 'document', 'createdAt', 'updatedAt']),
};

const CUSTOM_ENABLED: ReadonlySet<FilterModule> = new Set(['lead', 'contact']);

export function isFilterLeaf(node: FilterNode): node is FilterLeaf {
  return 'field' in node && 'op' in node;
}

export function compileFilterToPrisma(
  module: FilterModule,
  tenantId: string,
  filter: FilterNode | undefined | null,
  softDelete = true,
): Record<string, unknown> {
  const base: Record<string, unknown> = { tenantId };
  if (softDelete) base.deletedAt = null;

  if (!filter) return base;

  const compiled = compileNode(module, filter, 0);
  return { AND: [base, compiled] };
}

function compileNode(
  module: FilterModule,
  node: FilterNode,
  depth: number,
): Record<string, unknown> {
  if (depth > MAX_DEPTH) {
    throw new BadRequestException(`Filter nesting exceeds max depth ${MAX_DEPTH}`);
  }

  if ('and' in node) {
    if (!Array.isArray(node.and) || node.and.length === 0) {
      throw new BadRequestException('Empty and group');
    }
    return { AND: node.and.map((child) => compileNode(module, child, depth + 1)) };
  }

  if ('or' in node) {
    if (!Array.isArray(node.or) || node.or.length === 0) {
      throw new BadRequestException('Empty or group');
    }
    return { OR: node.or.map((child) => compileNode(module, child, depth + 1)) };
  }

  return compileLeaf(module, node);
}

function compileLeaf(module: FilterModule, leaf: FilterLeaf): Record<string, unknown> {
  if (!FILTER_OPS.includes(leaf.op)) {
    throw new BadRequestException(`Unsupported operator: ${leaf.op}`);
  }

  if (leaf.field.startsWith('custom.')) {
    if (!CUSTOM_ENABLED.has(module)) {
      throw new BadRequestException(`Custom fields not supported for module ${module}`);
    }
    const apiName = leaf.field.slice('custom.'.length);
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(apiName)) {
      throw new BadRequestException(`Invalid custom field name: ${apiName}`);
    }
    return compileJsonPath(apiName, leaf.op, leaf.value);
  }

  if (!SCALAR_FIELDS[module].has(leaf.field)) {
    throw new BadRequestException(`Field not allowed for ${module}: ${leaf.field}`);
  }

  return compileScalar(leaf.field, leaf.op, leaf.value);
}

function compileScalar(field: string, op: FilterOp, value: unknown): Record<string, unknown> {
  switch (op) {
    case 'eq':
      return { [field]: value };
    case 'neq':
      return { [field]: { not: value } };
    case 'contains':
      return { [field]: { contains: String(value ?? ''), mode: 'insensitive' } };
    case 'in':
      if (!Array.isArray(value)) throw new BadRequestException('in requires array value');
      return { [field]: { in: value } };
    case 'gt':
      return { [field]: { gt: value } };
    case 'gte':
      return { [field]: { gte: value } };
    case 'lt':
      return { [field]: { lt: value } };
    case 'lte':
      return { [field]: { lte: value } };
    case 'is_null':
      return { [field]: value === false ? { not: null } : null };
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

function compileJsonPath(apiName: string, op: FilterOp, value: unknown): Record<string, unknown> {
  const path = [apiName];
  switch (op) {
    case 'eq':
      return { customFields: { path, equals: value } };
    case 'neq':
      return { NOT: { customFields: { path, equals: value } } };
    case 'contains':
      return { customFields: { path, string_contains: String(value ?? '') } };
    case 'in':
      if (!Array.isArray(value)) throw new BadRequestException('in requires array value');
      return {
        OR: value.map((v) => ({ customFields: { path, equals: v } })),
      };
    case 'gt':
      return { customFields: { path, gt: value } };
    case 'gte':
      return { customFields: { path, gte: value } };
    case 'lt':
      return { customFields: { path, lt: value } };
    case 'lte':
      return { customFields: { path, lte: value } };
    case 'is_null':
      // Missing key or JSON null
      return value === false
        ? {
            NOT: {
              OR: [
                { customFields: { equals: Prisma.DbNull } },
                { customFields: { path, equals: Prisma.JsonNull } },
              ],
            },
          }
        : {
            OR: [
              { customFields: { equals: Prisma.DbNull } },
              { customFields: { path, equals: Prisma.JsonNull } },
            ],
          };
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

export function parseSearchBody(body: {
  filter?: FilterNode;
  page?: number;
  pageSize?: number;
  sort?: string;
}): {
  filter?: FilterNode;
  page: number;
  pageSize: number;
  skip: number;
  sortField: string;
  sortDir: 'asc' | 'desc';
} {
  const page = Math.max(1, Number(body.page) || 1);
  const rawSize = Number(body.pageSize) || 20;
  const pageSize = Math.min(100, Math.max(1, rawSize));
  const sortRaw = (body.sort ?? '-createdAt').trim();
  const sortDir: 'asc' | 'desc' = sortRaw.startsWith('-') ? 'desc' : 'asc';
  const sortField = sortRaw.replace(/^[-+]/, '') || 'createdAt';
  return {
    filter: body.filter,
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    sortField,
    sortDir,
  };
}

export function isScalarAllowed(module: FilterModule, field: string): boolean {
  if (field.startsWith('custom.')) return CUSTOM_ENABLED.has(module);
  return SCALAR_FIELDS[module].has(field);
}

export function filterModuleFields(module: FilterModule): string[] {
  return [...SCALAR_FIELDS[module]];
}
