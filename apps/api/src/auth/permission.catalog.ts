import { CampusRole } from '@prisma/client';
import { rolePermissions } from './auth.policy';

export const roleLabels: Record<CampusRole, string> = {
  estudiante: 'Estudiante', docente: 'Docente', ti_agente: 'Agente TI', ti_supervisor: 'Supervisor TI', administrador: 'Administrador',
};
type Action = 'consultar' | 'registrar' | 'atender' | 'asignar' | 'administrar';
const definition = (key: string, module: string, label: string, action: Action, scope: string, available = false) => ({ key, module, label, action, scope, available });
export const permissionCatalog = [
  definition('academic:read:self', 'Calendario académico', 'Consultar mi calendario', 'consultar', 'Institución y cursos propios', true),
  definition('academic:manage', 'Calendario académico', 'Gestionar eventos, cursos y secciones', 'administrar', 'Institución', true),
  definition('tickets:read:self', 'Incidencias', 'Consultar mis incidencias', 'consultar', 'Datos propios'),
  definition('tickets:create', 'Incidencias', 'Registrar incidencias', 'registrar', 'Datos propios'),
  definition('tickets:read:team', 'Atención de TI', 'Consultar incidencias del equipo', 'consultar', 'Equipo asignado'),
  definition('tickets:work:team', 'Atención de TI', 'Atender incidencias del equipo', 'atender', 'Equipo asignado'),
  definition('tickets:assign:team', 'Atención de TI', 'Asignar incidencias del equipo', 'asignar', 'Equipo asignado'),
  definition('certificates:request:self', 'Constancias', 'Solicitar mis constancias', 'registrar', 'Datos propios'),
  definition('reports:read:team', 'Reportes', 'Consultar reportes del equipo', 'consultar', 'Equipo asignado'),
  definition('reports:read:institution', 'Reportes', 'Consultar reportes de la institución', 'consultar', 'Institución'),
  definition('users:manage', 'Usuarios', 'Administrar usuarios y sus roles', 'administrar', 'Institución', true),
  definition('permissions:manage', 'Roles y permisos', 'Administrar permisos por rol', 'administrar', 'Institución', true),
  definition('configuration:manage', 'Configuración', 'Administrar la configuración', 'administrar', 'Institución'),
  definition('audit:read:institution', 'Auditoría', 'Consultar la auditoría', 'consultar', 'Institución'),
];
export const protectedPermissions = ['users:manage', 'permissions:manage'];
export const permissionDependencies: Record<string, string> = {
  'tickets:create': 'tickets:read:self', 'tickets:work:team': 'tickets:read:team',
  'tickets:assign:team': 'tickets:read:team', 'academic:manage': 'academic:read:self',
};
export function allowedPermissions(role: CampusRole): string[] {
  return role === 'administrador' ? permissionCatalog.map(p => p.key) : [...rolePermissions[role]];
}
