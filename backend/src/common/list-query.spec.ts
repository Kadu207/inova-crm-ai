import { parseListQuery, listResult } from './list-query';

describe('list-query', () => {
  it('parseListQuery applies defaults and clamps pageSize', () => {
    const q = parseListQuery({ page: 2, pageSize: 500, sort: '-title' });
    expect(q.page).toBe(2);
    expect(q.pageSize).toBe(100);
    expect(q.skip).toBe(100);
    expect(q.sortField).toBe('title');
    expect(q.sortDir).toBe('desc');
  });

  it('listResult builds envelope', () => {
    expect(listResult([{ id: 1 }], 10, 1, 20)).toEqual({
      data: [{ id: 1 }],
      meta: { page: 1, pageSize: 20, total: 10 },
    });
  });
});
