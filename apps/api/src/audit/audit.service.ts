import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CampusPrincipal } from '../auth/auth.policy';
import { AuditPageDto } from './audit.dto';
import * as v from './audit.validation';

type AuditRow = {
  id: string; occurredAt: Date; actorId: string; action: string;
  objectType: string; objectId: string | null; reason: string | null;
  before: unknown; after: unknown; actor: string;
};

const sensitive = /password|token|secret|credential|authorization|cookie|attachment|file|email|phone|address|content|description|text/i;
function sanitize(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (sensitive.test(key)) continue;
    if (item && typeof item === 'object' && !Array.isArray(item)) output[key] = sanitize(item);
    else if (['string', 'number', 'boolean'].includes(typeof item) || item === null) output[key] = item;
  }
  return output;
}

@Injectable()
export class AuditService {
  constructor(private readonly db: PrismaService) {}

  async list(actor: CampusPrincipal, query: unknown): Promise<AuditPageDto> {
    const q = v.auditQuery(query);
    const common = { institutionId: actor.institutionId, ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } : {}), ...(q.actorId ? { actorId: q.actorId } : {}) };
    const [academic, identity, permissions, consent] = await Promise.all([
      this.db.academicChange.findMany({ where: common, orderBy: { createdAt: 'desc' } }),
      this.db.identityChange.findMany({ where: common, orderBy: { createdAt: 'desc' } }),
      this.db.rolePermissionChange.findMany({ where: common, orderBy: { createdAt: 'desc' } }),
      this.db.consentAcceptance.findMany({ where: { institutionId: actor.institutionId, ...(q.from || q.to ? { acceptedAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } : {}), ...(q.actorId ? { userId: q.actorId } : {}) }, include: { consentVersion: true, user: { select: { displayName: true } } }, orderBy: { acceptedAt: 'desc' } }),
    ]);
    const rows: AuditRow[] = [
      ...academic.map(item => ({ id: item.id, occurredAt: item.createdAt, actorId: item.actorId, actor: item.actorId, action: item.action, objectType: item.entityType, objectId: item.entityId, reason: item.reason, before: item.before, after: item.after })),
      ...identity.map(item => ({ id: item.id, occurredAt: item.createdAt, actorId: item.actorId, actor: item.actorId, action: 'access.change', objectType: 'AppUser', objectId: item.subjectId, reason: item.reason, before: item.before, after: item.after })),
      ...permissions.map(item => ({ id: item.id, occurredAt: item.createdAt, actorId: item.actorId, actor: item.actorId, action: 'permissions.change', objectType: 'RoleAccess', objectId: null, reason: item.reason, before: item.before, after: item.after })),
      ...consent.map(item => ({ id: item.id, occurredAt: item.acceptedAt, actorId: item.userId, actor: item.user.displayName, action: 'consent.accept', objectType: 'ConsentVersion', objectId: item.consentVersionId, reason: null, before: null, after: { version: item.consentVersion.version, acceptedAt: item.acceptedAt.toISOString() } })),
    ].filter(item => (!q.objectType || item.objectType === q.objectType) && (!q.objectId || item.objectId === q.objectId) && (!q.action || item.action === q.action));
    const actorIds = [...new Set(rows.map(item => item.actorId))];
    const actors = await this.db.appUser.findMany({ where: { institutionId: actor.institutionId, id: { in: actorIds } }, select: { id: true, displayName: true } });
    const actorNames = new Map(actors.map(item => [item.id, item.displayName]));
    rows.forEach(item => { if (actorNames.has(item.actorId)) item.actor = actorNames.get(item.actorId)!; });
    rows.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime() || b.id.localeCompare(a.id));
    const total = rows.length;
    const items = rows.slice((q.page - 1) * q.pageSize, q.page * q.pageSize).map(item => ({ ...item, occurredAt: item.occurredAt.toISOString(), reason: item.reason && !sensitive.test(item.reason) ? item.reason : null, before: sanitize(item.before), after: sanitize(item.after) }));
    return { items, total, page: q.page, pageSize: q.pageSize };
  }
}
