import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { CampusRole } from '@prisma/client';
import { rolePermissions } from '../auth/auth.policy';

export interface AcademicPrincipal {
  id: string;
  institutionId: string;
  role: CampusRole;
  permissions: readonly string[];
  csrfVerified: boolean;
}

export interface AcademicRequest {
  method: string;
  academicPrincipal?: AcademicPrincipal;
}

// Puertos conectados a la sesión común; nunca interpretar identidad del cliente aquí.
export abstract class AcademicIdentity {
  abstract resolve(request: AcademicRequest): Promise<AcademicPrincipal | null>;
}
export abstract class AcademicDirectory {
  abstract belongsToInstitution(subjectId: string, institutionId: string): Promise<boolean>;
}
@Injectable()
export class AcademicSessionGuard implements CanActivate {
  constructor(@Inject(AcademicIdentity) private readonly identity: AcademicIdentity) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AcademicRequest>();
    const principal = await this.identity.resolve(request);
    const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
    if (!principal || !uuidPattern.test(principal.id) || !uuidPattern.test(principal.institutionId)) {
      throw new UnauthorizedException({ code: 'SESSION_REQUIRED', message: 'Necesitas una sesión válida para consultar el calendario.' });
    }
    if (!Object.hasOwn(rolePermissions, principal.role) || !principal.permissions?.includes('academic:read:self')) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'No tienes acceso al calendario.' });
    }
    if (!['GET', 'HEAD'].includes(request.method) && principal.csrfVerified !== true) {
      throw new ForbiddenException({ code: 'WRITE_PROTECTION_REQUIRED', message: 'No se pudo validar la operación. Vuelve a iniciar sesión.' });
    }
    request.academicPrincipal = principal;
    return true;
  }
}

export function requireAdministrator(principal: AcademicPrincipal) {
  if (!principal.permissions.includes('academic:manage')) {
    throw new ForbiddenException({ code: 'ADMIN_REQUIRED', message: 'No tienes permiso para gestionar el calendario.' });
  }
}

export function requireAcademicRead(principal: AcademicPrincipal) {
  if (!principal.permissions.includes('academic:read:self')) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'No tienes permiso para consultar el calendario.' });
}
