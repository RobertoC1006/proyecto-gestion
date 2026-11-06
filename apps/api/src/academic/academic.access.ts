import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

export interface AcademicPrincipal {
  id: string;
  institutionId: string;
  role: 'estudiante' | 'docente' | 'ti_agente' | 'ti_supervisor' | 'administrador';
  csrfVerified: boolean;
}

export interface AcademicRequest {
  method: string;
  academicPrincipal?: AcademicPrincipal;
}

// Puertos a conectar al módulo de Jasmine; nunca interpretar identidad del cliente aquí.
export abstract class AcademicIdentity {
  abstract resolve(request: AcademicRequest): Promise<AcademicPrincipal | null>;
}
export abstract class AcademicDirectory {
  abstract belongsToInstitution(subjectId: string, institutionId: string): Promise<boolean>;
}
@Injectable()
export class UnavailableIdentity extends AcademicIdentity {
  async resolve(): Promise<null> { return null; }
}
@Injectable()
export class UnavailableDirectory extends AcademicDirectory {
  async belongsToInstitution(): Promise<boolean> {
    throw new ServiceUnavailableException({ code: 'IDENTITY_NOT_AVAILABLE', message: 'No se pudo verificar el usuario.' });
  }
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
    if (!['estudiante', 'docente', 'ti_agente', 'ti_supervisor', 'administrador'].includes(principal.role)) {
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
  if (principal.role !== 'administrador') {
    throw new ForbiddenException({ code: 'ADMIN_REQUIRED', message: 'Solo administración puede gestionar el calendario.' });
  }
}
