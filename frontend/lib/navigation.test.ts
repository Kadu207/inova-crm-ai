import { describe, expect, it } from 'vitest';
import {
  canAccessNavItem,
  canAccessPath,
  filterNavItems,
  findNavItemForPath,
  NAV_ITEMS,
  normalizeRole,
} from './navigation';

describe('navigation RBAC (Spec 030)', () => {
  it('normalizeRole accepts Prisma role strings', () => {
    expect(normalizeRole('sales')).toBe('SALES');
    expect(normalizeRole('SUPER_ADMIN')).toBe('SUPER_ADMIN');
    expect(normalizeRole('nope')).toBeNull();
  });

  it('SALES does not see admin/auditoria/bulk', () => {
    const hrefs = filterNavItems('SALES').map((i) => i.href);
    expect(hrefs).toContain('/leads');
    expect(hrefs).toContain('/relatorios');
    expect(hrefs).not.toContain('/admin');
    expect(hrefs).not.toContain('/auditoria');
    expect(hrefs).not.toContain('/bulk');
    expect(hrefs).not.toContain('/financeiro');
  });

  it('VIEWER sees CRM core but not reports or sistema', () => {
    const hrefs = filterNavItems('VIEWER').map((i) => i.href);
    expect(hrefs).toContain('/leads');
    expect(hrefs).toContain('/funil');
    expect(hrefs).not.toContain('/relatorios');
    expect(hrefs).not.toContain('/usuarios');
    expect(hrefs).not.toContain('/admin');
  });

  it('SUPER_ADMIN sees /admin', () => {
    const hrefs = filterNavItems('SUPER_ADMIN').map((i) => i.href);
    expect(hrefs).toContain('/admin');
    expect(hrefs).toContain('/auditoria');
  });

  it('ADMIN sees sistema but not Admin SaaS', () => {
    const hrefs = filterNavItems('ADMIN').map((i) => i.href);
    expect(hrefs).toContain('/usuarios');
    expect(hrefs).toContain('/bulk');
    expect(hrefs).not.toContain('/admin');
  });

  it('canAccessPath blocks VIEWER deep-link to /usuarios', () => {
    expect(canAccessPath('/usuarios', 'VIEWER')).toBe(false);
    expect(canAccessPath('/leads/xyz', 'VIEWER')).toBe(true);
  });

  it('findNavItemForPath picks longest prefix', () => {
    expect(findNavItemForPath('/leads/abc')?.href).toBe('/leads');
    expect(findNavItemForPath('/admin')?.href).toBe('/admin');
  });

  it('items without roles allow all known roles', () => {
    const dashboard = NAV_ITEMS.find((i) => i.href === '/')!;
    expect(canAccessNavItem(dashboard, 'VIEWER')).toBe(true);
    expect(canAccessNavItem(dashboard, 'SUPPORT')).toBe(true);
  });

  it('missing role denies access', () => {
    expect(filterNavItems(null)).toEqual([]);
    expect(canAccessPath('/', undefined)).toBe(false);
  });
});
