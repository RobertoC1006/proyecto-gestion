import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppUser, CampusRole, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AuthConfig } from './auth.config';
import { CampusPrincipal, rolePermissions } from './auth.policy';
import { ProviderIdentity } from './auth.provider';

export const principalFor = (user: AppUser, csrfVerified: boolean): CampusPrincipal => ({
  id: user.id, institutionId: user.institutionId, email: user.email, displayName: user.displayName,
  role: user.role, active: user.active, teamId: user.teamId, accessVersion: user.accessVersion,
  permissions: rolePermissions[user.role], csrfVerified,
});

@Injectable()
export class IdentityDirectory {
  constructor(private readonly db: PrismaService, private readonly config: AuthConfig) {}
  async provision(identity: ProviderIdentity) {
    // Solo se llama tras getUser con credenciales verificadas; metadata nunca concede roles.
    const existing = await this.db.appUser.findUnique({ where: { id: identity.id } });
    if (existing) return existing;
    const institution = await this.db.institution.findUnique({ where: { code: this.config.institutionCode } });
    if (!institution) throw this.config.unavailable();
    return this.db.appUser.upsert({ where: { id: identity.id }, update: {}, create: {
      id: identity.id, institutionId: institution.id, email: identity.email,
      displayName: identity.displayName, role: 'estudiante',
    } });
  }
  async belongsToInstitution(subjectId: string, institutionId: string) {
    return !!await this.db.appUser.findFirst({ where: { id: subjectId, institutionId, active: true }, select: { id: true } });
  }
  // Servicio común para P20/P21 de Jasmine. No expone otro CRUD de usuarios ni login.
  async changeAccess(actorId: string, subjectId: string, input: {
    expectedVersion: number; role: CampusRole; active: boolean; teamId: string | null; reason: string;
  }) {
    if (!Object.values(CampusRole).includes(input.role) || typeof input.active !== 'boolean' ||
        !Number.isInteger(input.expectedVersion) || input.expectedVersion < 1 ||
        typeof input.reason !== 'string' || input.reason.trim().length < 5 || input.reason.trim().length > 500 ||
        (input.teamId !== null && !/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(input.teamId))) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Revisa el rol, equipo, versión y motivo del cambio.' });
    }
    return this.db.$transaction(async tx => {
      const candidate = await tx.appUser.findUnique({ where: { id: actorId } });
      if (!candidate) throw new ForbiddenException();
      // Serializa cambios de acceso por institución, incluido el último administrador.
      await tx.$queryRaw`SELECT "id" FROM "Institution" WHERE "id" = ${candidate.institutionId}::uuid FOR UPDATE`;
      const actor = await tx.appUser.findUnique({ where: { id: actorId } });
      if (!actor?.active || actor.role !== 'administrador') throw new ForbiddenException({ code: 'ADMIN_REQUIRED', message: 'Solo administración puede cambiar permisos.' });
      const subject = await tx.appUser.findFirst({ where: { id: subjectId, institutionId: actor.institutionId } });
      if (!subject) throw new NotFoundException({ code: 'NOT_FOUND', message: 'No se encontró el usuario.' });
      if (subject.accessVersion !== input.expectedVersion) throw new ConflictException({ code: 'CONFLICT', message: 'El acceso cambió. Actualiza antes de continuar.' });
      if (input.teamId && !await tx.supportTeam.findFirst({ where: { id: input.teamId, institutionId: actor.institutionId } })) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'El equipo no pertenece a esta institución.' });
      }
      if (subject.role === 'administrador' && subject.active && (!input.active || input.role !== 'administrador') &&
        await tx.appUser.count({ where: { institutionId: actor.institutionId, role: 'administrador', active: true } }) <= 1) {
        throw new ConflictException({ code: 'LAST_ADMINISTRATOR', message: 'Debe permanecer al menos un administrador activo.' });
      }
      const updated = await tx.appUser.update({ where: { id: subject.id }, data: {
        role: input.role, active: input.active, teamId: input.teamId, accessVersion: { increment: 1 },
      } });
      // La versión invalida inmediatamente sesiones previas; evita invertir el orden de bloqueos de login.
      const snapshot = (u: AppUser): Prisma.InputJsonObject => ({ role: u.role, active: u.active, teamId: u.teamId, accessVersion: u.accessVersion });
      await tx.identityChange.create({ data: { institutionId: actor.institutionId, actorId, subjectId,
        reason: input.reason.trim(), before: snapshot(subject), after: snapshot(updated) } });
      return principalFor(updated, false);
    });
  }
}
