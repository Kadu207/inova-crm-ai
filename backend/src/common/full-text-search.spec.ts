import { sanitizeFtsQuery } from './full-text-search';

describe('sanitizeFtsQuery', () => {
  it('trims and collapses whitespace', () => {
    expect(sanitizeFtsQuery('  acme   corp  ')).toBe('acme corp');
  });

  it('strips tsquery/LIKE metacharacters', () => {
    expect(sanitizeFtsQuery(`acme%_&|!():*`)).toBe('acme');
  });

  it('keeps email-like tokens', () => {
    expect(sanitizeFtsQuery('user@inova.com')).toBe('user@inova.com');
  });

  it('caps length at 200', () => {
    expect(sanitizeFtsQuery('a'.repeat(300)).length).toBe(200);
  });
});
