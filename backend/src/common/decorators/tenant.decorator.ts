import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../constants';

export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{
    tenantId?: string;
    user?: JwtPayload;
  }>();
  const tenantId = request.tenantId ?? request.user?.tenantId;
  if (!tenantId) {
    throw new Error('TenantId decorator used without tenant context');
  }
  return tenantId;
});

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
