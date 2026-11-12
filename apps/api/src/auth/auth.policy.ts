import { ForbiddenException } from '@nestjs/common';
import { CampusRole } from '@prisma/client';

// Valores iniciales. Tras autenticar, IdentityDirectory resuelve RoleAccess en la BD.
// Cada módulo comprueba además titular, institución y equipo, sin inferir permisos del rol.
const own = ['academic:read:self', 'tickets:create', 'tickets:read:self', 'certificates:request:self'];
export const rolePermissions: Record<CampusRole, readonly string[]> = {
  estudiante: own,
  docente: own,
  ti_agente: ['academic:read:self', 'tickets:read:team', 'tickets:work:team'],
  ti_supervisor: ['academic:read:self', 'tickets:read:team', 'tickets:work:team', 'tickets:assign:team', 'reports:read:team'],
  administrador: ['academic:read:self', 'academic:manage', 'users:manage', 'permissions:manage', 'reports:read:institution', 'audit:read:institution', 'configuration:manage'],
};
export interface CampusPrincipal {
  id: string; institutionId: string; email: string; displayName: string;
  role: CampusRole; teamId: string | null; active: boolean; accessVersion: number;
  permissions: readonly string[]; csrfVerified: boolean;
}
export function requirePermission(principal: CampusPrincipal, permission: string) {
  if (!principal.active || !principal.permissions.includes(permission)) {
    throw new ForbiddenException({ code: 'FORBIDDEN', message: 'No tienes permiso para realizar esta operación.' });
  }
}
export function requireScope(principal: CampusPrincipal, object: { institutionId: string; ownerId?: string; teamId?: string | null }, scope: 'self' | 'team' | 'institution') {
  if (!principal.active || principal.institutionId !== object.institutionId ||
    (scope === 'self' && object.ownerId !== principal.id) ||
    (scope === 'team' && (!principal.teamId || object.teamId !== principal.teamId))) {
    throw new ForbiddenException({ code: 'FORBIDDEN', message: 'No tienes acceso a este registro.' });
  }
}
