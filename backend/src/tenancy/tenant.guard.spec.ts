import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { TenantGuard } from './tenant.guard';
import { IS_PUBLIC_KEY } from '../common/constants';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  const createContext = (req: Record<string, unknown>): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantGuard(reflector);
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      return undefined;
    });
  });

  it('allows request with JWT tenant', () => {
    const req = { user: { tenantId: 't1' }, headers: {} };
    expect(guard.canActivate(createContext(req))).toBe(true);
    expect(req).toHaveProperty('tenantId', 't1');
  });

  it('rejects request without tenant context', () => {
    const req = { headers: {} };
    expect(() => guard.canActivate(createContext(req))).toThrow(ForbiddenException);
  });

  it('rejects tenant mismatch when JWT differs from resolved tenant', () => {
    const req = {
      user: { tenantId: 't1' },
      tenantId: 't2', // already resolved by middleware
      headers: { 'x-tenant-id': 't2' },
    };
    expect(() => guard.canActivate(createContext(req))).toThrow(ForbiddenException);
  });

  it('allows JWT tenant when header is slug-compatible via resolved tenantId', () => {
    const req = {
      user: { tenantId: 't1' },
      tenantId: 't1',
      headers: { 'x-tenant-id': 'demo' },
    };
    expect(guard.canActivate(createContext(req))).toBe(true);
  });
});
