import { BadRequestException } from '@nestjs/common';
import { parseCoql } from './coql-parser';

describe('CoqlParser', () => {
  it('parses SELECT FROM Leads with WHERE and LIMIT', () => {
    const ast = parseCoql(
      "SELECT id, title FROM Leads WHERE status = 'NEW' AND title like '%acme%' LIMIT 10",
    );
    expect(ast.module).toBe('Leads');
    expect(ast.filterModule).toBe('lead');
    expect(ast.select).toEqual(['id', 'title']);
    expect(ast.limit).toBe(10);
    expect(ast.filter).toEqual({
      and: [
        { field: 'status', op: 'eq', value: 'NEW' },
        { field: 'title', op: 'contains', value: 'acme' },
      ],
    });
  });

  it('rejects SELECT *', () => {
    expect(() => parseCoql('SELECT * FROM Leads')).toThrow(BadRequestException);
  });

  it('rejects injection-like keywords', () => {
    expect(() => parseCoql('SELECT id FROM Leads; DROP TABLE leads')).toThrow(BadRequestException);
    expect(() => parseCoql('SELECT id FROM Leads WHERE 1=1 UNION SELECT 1')).toThrow(
      BadRequestException,
    );
  });

  it('caps LIMIT at 200', () => {
    const ast = parseCoql('SELECT id FROM Deals LIMIT 9999');
    expect(ast.limit).toBe(200);
  });

  it('maps Accounts to company module', () => {
    const ast = parseCoql("SELECT id, name FROM Accounts WHERE name = 'Acme'");
    expect(ast.filterModule).toBe('company');
  });
});
