import { BadRequestException } from '@nestjs/common';
import { compileFilterToPrisma, FilterNode } from './filter-engine';

describe('FilterEngine', () => {
  it('always scopes by tenantId and soft-delete', () => {
    const where = compileFilterToPrisma('lead', 't1', {
      field: 'status',
      op: 'eq',
      value: 'NEW',
    });
    expect(where).toEqual({
      AND: [{ tenantId: 't1', deletedAt: null }, { status: 'NEW' }],
    });
  });

  it('compiles nested and/or', () => {
    const filter: FilterNode = {
      and: [
        { field: 'status', op: 'eq', value: 'NEW' },
        {
          or: [
            { field: 'title', op: 'contains', value: 'acme' },
            { field: 'custom.score_tier', op: 'eq', value: 'A' },
          ],
        },
      ],
    };
    const where = compileFilterToPrisma('lead', 't1', filter);
    expect(where).toMatchObject({
      AND: [
        { tenantId: 't1', deletedAt: null },
        {
          AND: [
            { status: 'NEW' },
            {
              OR: [
                { title: { contains: 'acme', mode: 'insensitive' } },
                { customFields: { path: ['score_tier'], equals: 'A' } },
              ],
            },
          ],
        },
      ],
    });
  });

  it('rejects unknown fields', () => {
    expect(() =>
      compileFilterToPrisma('lead', 't1', { field: 'passwordHash', op: 'eq', value: 'x' }),
    ).toThrow(BadRequestException);
  });

  it('rejects depth > 3', () => {
    const deep: FilterNode = {
      and: [
        {
          and: [
            {
              and: [
                {
                  and: [{ field: 'status', op: 'eq', value: 'NEW' }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(() => compileFilterToPrisma('lead', 't1', deep)).toThrow(BadRequestException);
  });

  it('rejects custom fields on opportunity', () => {
    expect(() =>
      compileFilterToPrisma('opportunity', 't1', {
        field: 'custom.foo',
        op: 'eq',
        value: 1,
      }),
    ).toThrow(BadRequestException);
  });
});
