import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthRequest, AuthService } from './auth.service';
import { requirePermission } from './auth.policy';

export const RequirePermissions = (...permissions: string[]) => SetMetadata('campus:permissions', permissions);
@Injectable()
export class CampusSessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const principal = await this.auth.resolve(request);
    if (!principal) throw new UnauthorizedException({ code: 'SESSION_REQUIRED', message: 'Necesitas una sesión válida.' });
    const permissions = this.reflector.getAllAndOverride<string[]>('campus:permissions', [context.getHandler(), context.getClass()]) || [];
    permissions.forEach(permission => requirePermission(principal, permission));
    request.campusPrincipal = principal; return true;
  }
}
