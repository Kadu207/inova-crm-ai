export type ListQueryInput = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  assignedToId?: string;
  createdFrom?: string;
  createdTo?: string;
  sort?: string;
};

export type ListMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export type ListResult<T> = {
  data: T[];
  meta: ListMeta;
};

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

export function parseListQuery(input: ListQueryInput): {
  page: number;
  pageSize: number;
  skip: number;
  q?: string;
  status?: string;
  assignedToId?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sortField: string;
  sortDir: 'asc' | 'desc';
} {
  const page = Math.max(1, Number(input.page) || 1);
  const rawSize = Number(input.pageSize) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize));
  const sortRaw = (input.sort ?? '-createdAt').trim();
  const sortDir: 'asc' | 'desc' = sortRaw.startsWith('-') ? 'desc' : 'asc';
  const sortField = sortRaw.replace(/^[-+]/, '') || 'createdAt';

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    q: input.q?.trim() || undefined,
    status: input.status?.trim() || undefined,
    assignedToId: input.assignedToId?.trim() || undefined,
    createdFrom: input.createdFrom ? new Date(input.createdFrom) : undefined,
    createdTo: input.createdTo ? new Date(input.createdTo) : undefined,
    sortField,
    sortDir,
  };
}

export function listResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): ListResult<T> {
  return { data, meta: { page, pageSize, total } };
}
