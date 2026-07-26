import { BadRequestException } from '@nestjs/common';
import {
  FilterModule,
  FilterNode,
  FilterOp,
  FILTER_OPS,
  isScalarAllowed,
} from '../filter-engine/filter-engine';

export type CoqlModule = 'Leads' | 'Contacts' | 'Accounts' | 'Deals';

export type CoqlAst = {
  module: CoqlModule;
  filterModule: FilterModule;
  select: string[] | 'all_scalars';
  filter?: FilterNode;
  sortField: string;
  sortDir: 'asc' | 'desc';
  limit: number;
};

const MODULE_MAP: Record<CoqlModule, FilterModule> = {
  Leads: 'lead',
  Contacts: 'contact',
  Accounts: 'company',
  Deals: 'opportunity',
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const FORBIDDEN = /\b(insert|update|delete|drop|alter|join|union|exec|execute|;|--|\/\*)\b/i;

/**
 * Minimal COQL: SELECT fields FROM Module [WHERE ...] [ORDER BY field [ASC|DESC]] [LIMIT n]
 * Compiles WHERE to FilterNode — never executes raw SQL.
 */
export function parseCoql(q: string): CoqlAst {
  const raw = q?.trim();
  if (!raw) throw new BadRequestException('COQL query is empty');
  if (FORBIDDEN.test(raw)) {
    throw new BadRequestException('COQL contains forbidden keywords');
  }

  const selectMatch = raw.match(
    /^SELECT\s+(.+?)\s+FROM\s+(Leads|Contacts|Accounts|Deals)\b(.*)$/is,
  );
  if (!selectMatch) {
    throw new BadRequestException(
      'COQL must start with SELECT … FROM Leads|Contacts|Accounts|Deals',
    );
  }

  const selectPart = selectMatch[1].trim();
  const module = selectMatch[2] as CoqlModule;
  let rest = (selectMatch[3] ?? '').trim();
  const filterModule = MODULE_MAP[module];

  let limit = DEFAULT_LIMIT;
  let sortField = 'createdAt';
  let sortDir: 'asc' | 'desc' = 'desc';
  let wherePart: string | undefined;

  const limitMatch = rest.match(/\bLIMIT\s+(\d+)\s*$/i);
  if (limitMatch) {
    limit = Math.min(MAX_LIMIT, Math.max(1, Number(limitMatch[1])));
    rest = rest.slice(0, limitMatch.index).trim();
  }

  const orderMatch = rest.match(/\bORDER\s+BY\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(ASC|DESC)?\s*$/i);
  if (orderMatch) {
    sortField = orderMatch[1];
    sortDir = (orderMatch[2]?.toLowerCase() as 'asc' | 'desc') || 'asc';
    rest = rest.slice(0, orderMatch.index).trim();
    if (!isScalarAllowed(filterModule, sortField) && !sortField.startsWith('custom')) {
      throw new BadRequestException(`ORDER BY field not allowed: ${sortField}`);
    }
  }

  const whereMatch = rest.match(/^WHERE\s+(.+)$/is);
  if (whereMatch) {
    wherePart = whereMatch[1].trim();
  } else if (rest.length > 0) {
    throw new BadRequestException(`Unexpected COQL suffix: ${rest}`);
  }

  const select = parseSelect(selectPart, filterModule);
  const filter = wherePart ? parseWhereExpr(wherePart, filterModule) : undefined;

  return { module, filterModule, select, filter, sortField, sortDir, limit };
}

function parseSelect(part: string, module: FilterModule): string[] | 'all_scalars' {
  if (part === '*') {
    throw new BadRequestException('SELECT * is not allowed; list fields or use id,title');
  }
  const fields = part
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
  if (fields.length === 0) throw new BadRequestException('SELECT list is empty');
  for (const field of fields) {
    if (!isScalarAllowed(module, field) && !field.startsWith('custom.')) {
      throw new BadRequestException(`SELECT field not allowed: ${field}`);
    }
  }
  return fields;
}

function parseWhereExpr(expr: string, module: FilterModule): FilterNode {
  return parseOr(expr.trim(), module);
}

function parseOr(expr: string, module: FilterModule): FilterNode {
  const parts = splitTopLevel(expr, 'OR');
  if (parts.length === 1) return parseAnd(parts[0], module);
  return { or: parts.map((p) => parseAnd(p, module)) };
}

function parseAnd(expr: string, module: FilterModule): FilterNode {
  const parts = splitTopLevel(expr, 'AND');
  if (parts.length === 1) return parsePrimary(parts[0], module);
  return { and: parts.map((p) => parsePrimary(p, module)) };
}

function parsePrimary(expr: string, module: FilterModule): FilterNode {
  const trimmed = expr.trim();
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return parseOr(trimmed.slice(1, -1).trim(), module);
  }
  return parseComparison(trimmed, module);
}

function parseComparison(expr: string, module: FilterModule): FilterNode {
  const isNull = expr.match(/^([a-zA-Z_][a-zA-Z0-9_.]*)\s+IS\s+(NOT\s+)?NULL$/i);
  if (isNull) {
    const field = isNull[1];
    assertField(module, field);
    return { field, op: 'is_null', value: !isNull[2] };
  }

  const ops: Array<{ re: RegExp; op: FilterOp }> = [
    { re: /^([a-zA-Z_][a-zA-Z0-9_.]*)\s*!=\s*(.+)$/s, op: 'neq' },
    { re: /^([a-zA-Z_][a-zA-Z0-9_.]*)\s*>=\s*(.+)$/s, op: 'gte' },
    { re: /^([a-zA-Z_][a-zA-Z0-9_.]*)\s*<=\s*(.+)$/s, op: 'lte' },
    { re: /^([a-zA-Z_][a-zA-Z0-9_.]*)\s*>\s*(.+)$/s, op: 'gt' },
    { re: /^([a-zA-Z_][a-zA-Z0-9_.]*)\s*<\s*(.+)$/s, op: 'lt' },
    { re: /^([a-zA-Z_][a-zA-Z0-9_.]*)\s*=\s*(.+)$/s, op: 'eq' },
    { re: /^([a-zA-Z_][a-zA-Z0-9_.]*)\s+like\s+(.+)$/is, op: 'contains' },
    { re: /^([a-zA-Z_][a-zA-Z0-9_.]*)\s+in\s+\((.+)\)$/is, op: 'in' },
  ];

  for (const { re, op } of ops) {
    const m = expr.match(re);
    if (!m) continue;
    const field = m[1];
    assertField(module, field);
    if (!FILTER_OPS.includes(op)) continue;
    if (op === 'in') {
      const values = m[2].split(',').map((v) => parseLiteral(v.trim()));
      return { field, op, value: values };
    }
    let literal = parseLiteral(m[2].trim());
    if (op === 'contains' && typeof literal === 'string') {
      literal = literal.replace(/%/g, '');
    }
    return { field, op, value: literal };
  }

  throw new BadRequestException(`Cannot parse WHERE clause: ${expr}`);
}

function assertField(module: FilterModule, field: string): void {
  if (!isScalarAllowed(module, field)) {
    throw new BadRequestException(`Field not allowed: ${field}`);
  }
}

function parseLiteral(raw: string): unknown {
  if (raw === 'null' || raw === 'NULL') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  const str = raw.match(/^'(.*)'$/s) || raw.match(/^"(.*)"$/s);
  if (str) return str[1].replace(/\\'/g, "'").replace(/\\"/g, '"');
  throw new BadRequestException(`Invalid literal: ${raw}`);
}

/** Split by keyword at paren depth 0. */
function splitTopLevel(expr: string, keyword: 'AND' | 'OR'): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  const tokens = tokenize(expr);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '(') depth++;
    if (t === ')') depth--;
    if (depth === 0 && t.toUpperCase() === keyword) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += (current && !/^[(,]$/.test(t) && current.slice(-1) !== '(' ? ' ' : '') + t;
  }
  if (current.trim()) parts.push(current.trim());
  return parts.length ? parts : [expr];
}

function tokenize(expr: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < expr.length && expr[j] !== c) {
        if (expr[j] === '\\') j++;
        j++;
      }
      out.push(expr.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if ('()<>=!,'.includes(c)) {
      if ((c === '!' || c === '>' || c === '<') && expr[i + 1] === '=') {
        out.push(expr.slice(i, i + 2));
        i += 2;
        continue;
      }
      out.push(c);
      i++;
      continue;
    }
    let j = i;
    while (j < expr.length && !/\s/.test(expr[j]) && !'()<>=!,'.includes(expr[j])) j++;
    out.push(expr.slice(i, j));
    i = j;
  }
  return out;
}
