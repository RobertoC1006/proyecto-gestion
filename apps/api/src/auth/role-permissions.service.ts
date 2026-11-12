import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { CampusRole, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CampusPrincipal, rolePermissions } from './auth.policy';
import { allowedPermissions, permissionCatalog, permissionDependencies, protectedPermissions, roleLabels } from './permission.catalog';

type Reader = Pick<Prisma.TransactionClient, 'roleAccess'>;
const roles = Object.values(CampusRole);
const invalid = (message: string) => new BadRequestException({ code: 'VALIDATION_ERROR', message });

@Injectable()
export class RolePermissionsService {
  constructor(private readonly db: PrismaService) {}
  async effective(institutionId: string, role: CampusRole, db: Reader = this.db) {
    const stored = await db.roleAccess.findUnique({ where: { institutionId_role: { institutionId, role } } });
    return stored ? stored.permissions : [...rolePermissions[role]];
  }
  private view(role: CampusRole, row?: { permissions: string[]; version: number; updatedAt: Date } | null) {
    return { role, label: roleLabels[role], permissions: row?.permissions ?? [...rolePermissions[role]],
      version: row?.version ?? 0, updatedAt: row?.updatedAt.toISOString() ?? null,
      allowedPermissions: allowedPermissions(role), protectedPermissions: role === 'administrador' ? protectedPermissions : [] };
  }
  async list(actor: CampusPrincipal) {
    this.authorize(actor);
    const rows = await this.db.roleAccess.findMany({ where: { institutionId: actor.institutionId } });
    return { roles: roles.map(role => this.view(role, rows.find(row => row.role === role))), catalog: permissionCatalog, dependencies: permissionDependencies };
  }
  private authorize(actor: CampusPrincipal) {
    if (!actor.active || actor.role !== 'administrador' || !actor.permissions.includes('permissions:manage')) {
      throw new ForbiddenException({ code: 'ADMIN_REQUIRED', message: 'Solo administración puede configurar los permisos.' });
    }
  }
  async update(actor: CampusPrincipal, roleValue: string, value: unknown) {
    this.authorize(actor);
    if (!roles.includes(roleValue as CampusRole)) throw invalid('Selecciona uno de los cinco roles disponibles.');
    const role = roleValue as CampusRole;
    const body = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
    if (Object.keys(body).some(key => !['permissions', 'expectedVersion', 'reason'].includes(key)) ||
      !Number.isInteger(body.expectedVersion) || Number(body.expectedVersion) < 0 ||
      !Array.isArray(body.permissions) || body.permissions.length > permissionCatalog.length ||
      body.permissions.some(key => typeof key !== 'string') || new Set(body.permissions).size !== body.permissions.length ||
      typeof body.reason !== 'string' || body.reason.trim().length < 5 || body.reason.trim().length > 500) {
      throw invalid('Revisa los permisos y escribe un motivo de entre 5 y 500 caracteres.');
    }
    const selected = (body.permissions as string[]).slice().sort();
    const allowed = allowedPermissions(role);
    if (selected.some(key => !allowed.includes(key))) throw invalid('Un permiso excede el alcance permitido para este rol.');
    if (role === 'administrador' && protectedPermissions.some(key => !selected.includes(key))) {
      throw invalid('Los permisos de usuarios y roles deben permanecer activos para administración.');
    }
    for (const key of selected) {
      if (permissionDependencies[key] && !selected.includes(permissionDependencies[key])) throw invalid('Activa también el permiso de consulta necesario para esta acción.');
    }
    const reason = body.reason.trim();
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Institution" WHERE "id" = ${actor.institutionId}::uuid FOR UPDATE`;
      const currentActor = await tx.appUser.findFirst({ where: { id: actor.id, institutionId: actor.institutionId } });
      if (!currentActor) throw new ForbiddenException();
      this.authorize({ ...actor, active: currentActor.active, role: currentActor.role,
        permissions: await this.effective(actor.institutionId, currentActor.role, tx) });
      const current = await tx.roleAccess.findUnique({ where: { institutionId_role: { institutionId: actor.institutionId, role } } });
      if ((current?.version ?? 0) !== body.expectedVersion) throw new ConflictException({ code: 'CONFLICT', message: 'Este rol cambió. Actualiza la matriz antes de guardar.' });
      const previous = current?.permissions ?? [...rolePermissions[role]];
      if (JSON.stringify([...previous].sort()) === JSON.stringify(selected)) return this.view(role, current);
      const updated = await tx.roleAccess.upsert({ where: { institutionId_role: { institutionId: actor.institutionId, role } },
        create: { institutionId: actor.institutionId, role, permissions: selected },
        update: { permissions: selected, version: { increment: 1 } } });
      await tx.rolePermissionChange.create({ data: { institutionId: actor.institutionId, role, actorId: actor.id, reason,
        before: { permissions: previous, version: current?.version ?? 0 }, after: { permissions: selected, version: updated.version } } });
      return this.view(role, updated);
    });
  }
}
