import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    tenant: { findUnique: jest.Mock; create: jest.Mock };
    user: { findUnique: jest.Mock };
    withTenant: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      tenant: { findUnique: jest.fn(), create: jest.fn() },
      user: { findUnique: jest.fn() },
      withTenant: jest.fn((_tenantId: string, fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          user: {
            findUnique: (...args: unknown[]) => prisma.user.findUnique(...args),
            create: jest.fn(),
            findFirst: jest.fn(),
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token-abc') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('login rejects invalid tenant', async () => {
    prisma.tenant.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'a@b.com', password: 'password1', tenantSlug: 'missing' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('login succeeds with valid credentials', async () => {
    const hash = await bcrypt.hash('password1', 12);
    prisma.tenant.findUnique.mockResolvedValue({
      id: 't1',
      slug: 'acme',
      name: 'Acme',
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'Admin',
      passwordHash: hash,
      isActive: true,
      role: UserRole.ADMIN,
    });

    const result = await service.login({
      email: 'a@b.com',
      password: 'password1',
      tenantSlug: 'acme',
    });

    expect(result.accessToken).toBe('token-abc');
    expect(result.tenantId).toBe('t1');
    expect(result.tenantSlug).toBe('acme');
    expect(result.userName).toBe('Admin');
  });
});
