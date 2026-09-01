import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY, PLATFORM_API_KEY } from '../common/constants';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let config: { get: jest.Mock };

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
    config = {
      get: jest.fn((key: string, def?: string) => {
        if (key === 'API_TOKEN') return 'test-api-token';
        return def;
      }),
    };
    guard = new JwtAuthGuard(reflector, config as unknown as ConfigService);
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PLATFORM_API_KEY) return false;
      return undefined;
    });
  });

  it('allows API_TOKEN on PlatformApi without x-tenant-id', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PLATFORM_API_KEY) return true;
      return undefined;
    });
    const req: Record<string, unknown> = {
      headers: { authorization: 'Bearer test-api-token' },
    };
    expect(guard.canActivate(createContext(req))).toBe(true);
    expect(req.user).toMatchObject({
      sub: 'api-token',
      role: UserRole.SUPER_ADMIN,
    });
  });

  it('rejects human JWT on PlatformApi (F-10)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PLATFORM_API_KEY) return true;
      return undefined;
    });
    const req = {
      headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.e30.sig' },
    };
    expect(() => guard.canActivate(createContext(req))).toThrow(UnauthorizedException);
  });

  it('rejects missing Authorization on PlatformApi', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === PLATFORM_API_KEY) return true;
      return undefined;
    });
    const req = { headers: {} };
    expect(() => guard.canActivate(createContext(req))).toThrow(UnauthorizedException);
  });

  it('requires x-tenant-id for API_TOKEN on non-platform routes', () => {
    const req = {
      headers: { authorization: 'Bearer test-api-token' },
    };
    expect(() => guard.canActivate(createContext(req))).toThrow(ForbiddenException);
  });

  it('allows public routes without auth', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });
    const req = { headers: {} };
    expect(guard.canActivate(createContext(req))).toBe(true);
  });
});
