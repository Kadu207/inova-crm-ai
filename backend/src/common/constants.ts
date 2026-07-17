import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const TENANT_HEADER = 'x-tenant-id';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
}

export interface RequestWithTenant extends Request {
  tenantId?: string;
  user?: JwtPayload;
}
