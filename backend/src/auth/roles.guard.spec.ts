import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../common/constants';

function mockContext(role?: UserRole): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  beforeEach(() => {
    reflector.getAllAndOverride.mockReset();
  });

  it('allows public routes', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('allows when no roles required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(mockContext(UserRole.VIEWER))).toBe(true);
  });

  it('allows SUPER_ADMIN even when not listed in @Roles', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES];
      return undefined;
    });
    expect(guard.canActivate(mockContext(UserRole.SUPER_ADMIN))).toBe(true);
  });

  it('allows listed role', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [UserRole.ADMIN, UserRole.SALES];
      return undefined;
    });
    expect(guard.canActivate(mockContext(UserRole.SALES))).toBe(true);
  });

  it('rejects role outside @Roles', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES];
      return undefined;
    });
    expect(() => guard.canActivate(mockContext(UserRole.SUPPORT))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(mockContext(UserRole.SUPPORT))).toThrow(
      'Insufficient permissions',
    );
  });
});
