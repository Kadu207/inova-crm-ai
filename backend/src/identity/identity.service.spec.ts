import { ForbiddenException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { IdentityService } from './identity.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssignableUserRole } from './dto/user.dto';

describe('IdentityService', () => {
  let service: IdentityService;
  const prisma = {
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdentityService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(IdentityService);
  });

  it('create rejects SUPER_ADMIN even if role slips through', async () => {
    await expect(
      service.create('t1', {
        email: 'a@b.com',
        name: 'Evil',
        password: 'password1',
        role: UserRole.SUPER_ADMIN as unknown as AssignableUserRole,
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('update rejects SUPER_ADMIN', async () => {
    await expect(
      service.update('t1', 'u1', {
        role: UserRole.SUPER_ADMIN as unknown as AssignableUserRole,
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('create accepts assignable role ADMIN', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      tenantId: 't1',
      email: 'a@b.com',
      name: 'Admin',
      role: UserRole.ADMIN,
      passwordHash: 'hash',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const user = await service.create('t1', {
      email: 'a@b.com',
      name: 'Admin',
      password: 'password1',
      role: AssignableUserRole.ADMIN,
    });

    expect(user.role).toBe(UserRole.ADMIN);
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('create rejects duplicate email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(
      service.create('t1', {
        email: 'a@b.com',
        name: 'Admin',
        password: 'password1',
        role: AssignableUserRole.SALES,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('update uses updateMany with tenantId', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      tenantId: 't1',
      email: 'a@b.com',
      name: 'Old',
      role: UserRole.SALES,
      passwordHash: 'hash',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await service.update('t1', 'u1', { name: 'New' });

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'u1', tenantId: 't1' },
      data: { name: 'New', role: undefined },
    });
  });
});
