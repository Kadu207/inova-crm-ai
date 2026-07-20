import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';
export const PLATFORM_API_KEY = 'platformApi';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
/** API_TOKEN may omit x-tenant-id; used for platform-wide cron jobs (e.g. SLA check-all). */
export const PlatformApi = () => SetMetadata(PLATFORM_API_KEY, true);

export const TENANT_HEADER = 'x-tenant-id';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
  role: UserRole;
}

export interface RequestWithTenant extends Request {
  tenantId?: string;
  user?: JwtPayload;
}
