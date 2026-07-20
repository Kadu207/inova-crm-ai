import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { IS_PUBLIC_KEY, JwtPayload, PLATFORM_API_KEY, TENANT_HEADER } from '../common/constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const isPlatformApi = this.reflector.getAllAndOverride<boolean>(PLATFORM_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: JwtPayload;
      tenantId?: string;
    }>();

    const auth = request.headers.authorization ?? '';
    const apiToken = this.config.get<string>('API_TOKEN', '');
    if (apiToken && auth === `Bearer ${apiToken}`) {
      if (isPlatformApi) {
        request.user = {
          sub: 'api-token',
          email: 'api-token@system',
          role: UserRole.SUPER_ADMIN,
        };
        return true;
      }

      const headerTenant = request.headers[TENANT_HEADER] ?? request.headers['X-Tenant-Id'];
      const tenantId = request.tenantId ?? headerTenant;
      if (!tenantId) {
        throw new ForbiddenException('x-tenant-id required when using API_TOKEN');
      }
      request.user = {
        sub: 'api-token',
        email: 'api-token@system',
        tenantId,
        role: UserRole.ADMIN,
      };
      request.tenantId = tenantId;
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<T>(err: Error | null, user: T): T {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
