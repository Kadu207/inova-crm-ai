import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, JwtPayload, TENANT_HEADER } from '../common/constants';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: JwtPayload;
      headers: Record<string, string | undefined>;
      tenantId?: string;
    }>();

    const tenantFromJwt = request.user?.tenantId;
    const tenantFromHeader = request.headers[TENANT_HEADER] ?? request.headers['X-Tenant-Id'];
    // Prefer middleware-resolved id (slug → id) over raw header.
    const tenantId = request.tenantId ?? tenantFromJwt ?? tenantFromHeader;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    if (tenantFromJwt && request.tenantId && tenantFromJwt !== request.tenantId) {
      throw new ForbiddenException('Tenant mismatch between JWT and header');
    }

    request.tenantId = tenantId;
    return true;
  }
}
