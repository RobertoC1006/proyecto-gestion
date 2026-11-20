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
function sanitize(value: unknown): unknown {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return value
      .map(item => sanitize(item))
      .filter(item => item !== null)
      .slice(0, 100);
  }
  if (typeof value !== 'object') {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : null;
  }
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (sensitive.test(key)) continue;
    const cleaned = sanitize(item);
    if (cleaned !== null) output[key] = cleaned;
  }
  return output;
}

@Injectable()
export class AuditService {
  constructor(private readonly db: PrismaService) {}

  async list(actor: CampusPrincipal, query: unknown): Promise<AuditPageDto> {
    const q = v.auditQuery(query);
    const common = { institutionId: actor.institutionId, ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } : {}), ...(q.actorId ? { actorId: q.actorId } : {}) };
    const bounded = Math.min(10000, q.page * q.pageSize + q.pageSize);
    const [academic, identity, permissions, consent, tickets] = await Promise.all([
      this.db.academicChange.findMany({ where: common, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: bounded }),
      this.db.identityChange.findMany({ where: common, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: bounded }),
      this.db.rolePermissionChange.findMany({ where: common, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: bounded }),
      this.db.consentAcceptance.findMany({ where: { institutionId: actor.institutionId, ...(q.from || q.to ? { acceptedAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } : {}), ...(q.actorId ? { userId: q.actorId } : {}) }, include: { consentVersion: true, user: { select: { displayName: true } } }, orderBy: [{ acceptedAt: 'desc' }, { id: 'desc' }], take: bounded }),
      this.db.ticketChange.findMany({ where: common, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: bounded }),
    ]);
    const rows: AuditRow[] = [
      ...academic.map(item => ({ id: item.id, occurredAt: item.createdAt, actorId: item.actorId, actor: item.actorId, action: item.action, objectType: item.entityType, objectId: item.entityId, reason: item.reason, before: item.before, after: item.after })),
      ...identity.map(item => ({ id: item.id, occurredAt: item.createdAt, actorId: item.actorId, actor: item.actorId, action: 'access.change', objectType: 'AppUser', objectId: item.subjectId, reason: item.reason, before: item.before, after: item.after })),
      ...permissions.map(item => ({ id: item.id, occurredAt: item.createdAt, actorId: item.actorId, actor: item.actorId, action: 'permissions.change', objectType: 'RoleAccess', objectId: null, reason: item.reason, before: item.before, after: item.after })),
      ...consent.map(item => ({ id: item.id, occurredAt: item.acceptedAt, actorId: item.userId, actor: item.user.displayName, action: 'consent.accept', objectType: 'ConsentVersion', objectId: item.consentVersionId, reason: null, before: null, after: { version: item.consentVersion.version, acceptedAt: item.acceptedAt.toISOString() } })),
      ...tickets.map(item => ({ id: item.id, occurredAt: item.createdAt, actorId: item.actorId, actor: item.actorId, action: `ticket.${item.action}`, objectType: 'Ticket', objectId: item.ticketId, reason: item.note, before: item.before, after: item.after })),
    ].filter(item => (!q.objectType || item.objectType === q.objectType) && (!q.objectId || item.objectId === q.objectId) && (!q.action || item.action === q.action));
    const actorIds = [...new Set(rows.map(item => item.actorId))];
    const actors = await this.db.appUser.findMany({ where: { institutionId: actor.institutionId, id: { in: actorIds } }, select: { id: true, displayName: true } });
    const actorNames = new Map(actors.map(item => [item.id, item.displayName]));
    rows.forEach(item => { if (actorNames.has(item.actorId)) item.actor = actorNames.get(item.actorId)!; });
    rows.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime() || b.id.localeCompare(a.id));
    const total = rows.length;
    const items = rows.slice((q.page - 1) * q.pageSize, q.page * q.pageSize).map(item => {
      const beforeValue = sanitize(item.before);
      const afterValue = sanitize(item.after);
      return {
        ...item,
        occurredAt: item.occurredAt.toISOString(),
        reason: item.reason && !sensitive.test(item.reason) ? item.reason : null,
        before: beforeValue && typeof beforeValue === 'object' && !Array.isArray(beforeValue) ? beforeValue as Record<string, unknown> : null,
        after: afterValue && typeof afterValue === 'object' && !Array.isArray(afterValue) ? afterValue as Record<string, unknown> : null,
      };
    });
    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  async export(actor: CampusPrincipal, query: unknown) {
    const q = v.auditQuery({ ...(query as Record<string, unknown>), page: 1, pageSize: 100 });
    const result = await this.list(actor, q);
    const escape = (value: unknown) => {
      const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
      return `"${text.replace(/[\r\n]/g, ' ').replace(/"/g, '""')}"`;
    };
    const lines = [
      ['id', 'occurredAt', 'actorId', 'actor', 'action', 'objectType', 'objectId', 'reason'].join(','),
      ...result.items.map(item => [
        item.id,
        item.occurredAt,
        item.actorId,
        item.actor,
        item.action,
        item.objectType,
        item.objectId,
        item.reason,
      ].map(escape).join(',')),
    ];
    return lines.join('\r\n');
  }
}
