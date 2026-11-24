import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CampusPrincipal } from '../auth/auth.policy';
import { AuditPageDto } from './audit.dto';
import * as v from './audit.validation';

type AuditRow = {
  id: string; occurredAt: Date; actorId: string | null; action: string;
  objectType: string; objectId: string | null; reason: string | null;
  before: unknown; after: unknown; actor: string; source: number;
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
    const matched = this.matching(actor, q);
    return this.db.$transaction(async tx => {
      const [count] = await tx.$queryRaw<{ total: bigint }[]>(Prisma.sql`SELECT count(*) AS total FROM (${matched}) m`);
      const rows = await this.read(tx, matched, Prisma.sql`OFFSET ${(q.page - 1) * q.pageSize}`, q.pageSize);
      return { items: rows.map(item => this.dto(item)), total: Number(count.total), page: q.page, pageSize: q.pageSize };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  // Parsed values stay private: each public entrypoint validates exactly once.
  private matching(actor: CampusPrincipal, q: ReturnType<typeof v.auditQuery>) {
    return Prisma.sql`
      SELECT h.*, coalesce(u."displayName", h."actorId"::text, 'Consulta pública') AS actor FROM (
        SELECT id, "institutionId", "createdAt" AS "occurredAt", "actorId", action,
          "entityType" AS "objectType", "entityId" AS "objectId", reason, "before", "after", 1 AS source FROM "AcademicChange"
        UNION ALL
        SELECT id, "institutionId", "createdAt", "actorId", 'access.change', 'AppUser', "subjectId", reason, "before", "after", 2 FROM "IdentityChange"
        UNION ALL
        SELECT id, "institutionId", "createdAt", "actorId", 'permissions.change', 'RoleAccess', NULL::uuid, reason, "before", "after", 3 FROM "RolePermissionChange"
        UNION ALL
        SELECT c.id, c."institutionId", c."acceptedAt", c."userId", 'consent.accept', 'ConsentVersion', c."consentVersionId", NULL, NULL::jsonb,
          jsonb_build_object('version', v.version, 'acceptedAt', to_char(c."acceptedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')), 4
          FROM "ConsentAcceptance" c JOIN "ConsentVersion" v ON v.id = c."consentVersionId"
        UNION ALL
        SELECT id, "institutionId", "createdAt", "actorId", 'ticket.' || action, 'Ticket', "ticketId", note, "before", "after", 5 FROM "TicketChange"
        UNION ALL
        SELECT id, "institutionId", "issuedAt", "ownerId", 'certificate.issue', 'Certificate', id, NULL, NULL::jsonb,
          jsonb_build_object('code', code, 'ticketId', "ticketId", 'sha256', sha256), 6 FROM "Certificate"
        UNION ALL
        SELECT id, "institutionId", "occurredAt", NULL::uuid, 'certificate.verify', 'Certificate', "certificateId", NULL, NULL::jsonb,
          jsonb_build_object('code', code, 'result', result), 7 FROM "CertificateVerification"
      ) h LEFT JOIN "AppUser" u ON u.id = h."actorId" AND u."institutionId" = h."institutionId"
      WHERE h."institutionId" = ${actor.institutionId}::uuid
        ${q.from ? Prisma.sql`AND h."occurredAt" >= ${q.from}` : Prisma.empty}
        ${q.to ? Prisma.sql`AND h."occurredAt" <= ${q.to}` : Prisma.empty}
        ${q.actorId ? Prisma.sql`AND h."actorId" = ${q.actorId}::uuid` : Prisma.empty}
        ${q.objectId ? Prisma.sql`AND h."objectId" = ${q.objectId}::uuid` : Prisma.empty}
        ${q.objectType ? Prisma.sql`AND h."objectType" = ${q.objectType}` : Prisma.empty}
        ${q.action ? Prisma.sql`AND h.action = ${q.action}` : Prisma.empty}`;
  }

  private read(tx: Prisma.TransactionClient, matched: Prisma.Sql, offset: Prisma.Sql, take: number, cursor?: AuditRow) {
    return tx.$queryRaw<AuditRow[]>(Prisma.sql`SELECT * FROM (${matched}) m
      ${cursor ? Prisma.sql`WHERE ("occurredAt", id, source) < (${cursor.occurredAt}, ${cursor.id}::uuid, ${cursor.source})` : Prisma.empty}
      ORDER BY "occurredAt" DESC, id DESC, source DESC LIMIT ${take} ${offset}`);
  }

  private dto(item: AuditRow) {
    const before = sanitize(item.before), after = sanitize(item.after);
    // Do not leak SQL-only scope or cursor columns into the public DTO.
    return {
      id: item.id, occurredAt: item.occurredAt.toISOString(), actorId: item.actorId, actor: item.actor,
      action: item.action, objectType: item.objectType, objectId: item.objectId,
      reason: item.reason && !sensitive.test(item.reason) ? item.reason : null,
      before: before && typeof before === 'object' && !Array.isArray(before) ? before as Record<string, unknown> : null,
      after: after && typeof after === 'object' && !Array.isArray(after) ? after as Record<string, unknown> : null,
    };
  }

  async export(actor: CampusPrincipal, query: unknown, write: (chunk: string) => Promise<boolean>) {
    const q = v.auditQuery(query);
    const matched = this.matching(actor, q);
    const escape = (value: unknown) => {
      const raw = String(value ?? '');
      const text = raw.replace(/[\r\n]/g, ' ');
      const literal = /^\s*[=+\-@＝＋－＠]|^[\t\r\n]/u.test(raw) ? "'" + text : text;
      return `"${literal.replace(/"/g, '""')}"`;
    };
    await this.db.$transaction(async tx => {
      let cursor: AuditRow | undefined;
      if (!await write('id,occurredAt,actorId,actor,action,objectType,objectId,reason')) return;
      while (true) {
        const rows = await this.read(tx, matched, Prisma.empty, 100, cursor);
        if (!rows.length) return;
        const chunk = rows.map(row => {
          const item = this.dto(row);
          return [item.id, item.occurredAt, item.actorId, item.actor, item.action, item.objectType, item.objectId, item.reason].map(escape).join(',');
        }).join('\r\n');
        if (!await write('\r\n' + chunk)) return;
        cursor = rows[rows.length - 1];
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 120000 });
  }
}
