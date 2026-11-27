import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, TicketService, TicketStatus } from '@prisma/client';
import { CampusPrincipal, requirePermission } from '../auth/auth.policy';
import { PrismaService } from '../database/prisma.service';

const serviceLabels: Record<TicketService, string> = {
  aula_virtual: 'Aula virtual',
  wifi_red: 'Wi-Fi/red',
  correo: 'Correo institucional',
  equipos: 'Equipo de cómputo',
  impresoras: 'Impresora',
  cuentas_accesos: 'Cuentas y accesos',
  videoconferencia: 'Videoconferencia',
  sistemas_institucionales: 'Sistemas institucionales',
  almacenamiento_nube: 'Almacenamiento/nube',
  software_licencias: 'Software/licencias',
  otro: 'Otro',
};

type ReportQuery = {
  from: Date;
  to: Date;
  period: 'day' | 'week' | 'month';
  service?: TicketService;
  status?: TicketStatus;
  scope: 'institution' | 'team';
};

function invalid(field: string, message: string): never {
  throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Revisa los campos indicados.', fields: { [field]: message } });
}

// Calendar keys represent dates in America/Lima (UTC-05), independently of the server TZ.
function limaCalendar(value: Date) {
  return new Date(value.getTime() - 5 * 3600000);
}

function periodStart(value: Date, period: ReportQuery['period']) {
  const local = limaCalendar(value);
  if (period === 'month') return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1));
  const day = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
  if (period === 'week') {
    const weekday = (day.getUTCDay() + 6) % 7;
    day.setUTCDate(day.getUTCDate() - weekday);
    return day;
  }
  return day;
}

function periodKey(value: Date, period: ReportQuery['period']) {
  const start = periodStart(value, period);
  return start.toISOString().slice(0, 10);
}

function addPeriod(value: Date, period: ReportQuery['period']) {
  const next = new Date(value);
  if (period === 'month') next.setUTCMonth(next.getUTCMonth() + 1);
  else next.setUTCDate(next.getUTCDate() + (period === 'week' ? 7 : 1));
  return next;
}

@Injectable()
export class ReportsService {
  constructor(private readonly db: PrismaService) {}

  private query(actor: CampusPrincipal, raw: unknown): ReportQuery {
    const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    const hasTeam = actor.permissions.includes('reports:read:team');
    const hasInstitution = actor.permissions.includes('reports:read:institution');
    if (!hasTeam && !hasInstitution) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'No tienes permiso para consultar reportes.' });
    }
    const allowed = ['from', 'to', 'period', 'service', 'status', 'scope'];
    for (const key of Object.keys(input)) if (!allowed.includes(key)) invalid(key, 'Campo no admitido.');

    const period = input.period == null || input.period === '' ? 'week' : input.period;
    if (!['day', 'week', 'month'].includes(String(period))) invalid('period', 'Periodo no válido.');

    const to = input.to == null || input.to === '' ? new Date() : new Date(String(input.to));
    const from = input.from == null || input.from === '' ? new Date(to.getTime() - 42 * 86400000) : new Date(String(input.from));
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) invalid('from', 'Fecha no válida.');
    if (to <= from) invalid('to', 'La fecha final debe ser posterior a la inicial.');
    if (to.getTime() - from.getTime() > 366 * 86400000) invalid('from', 'El intervalo no puede superar 366 días.');

    const service = input.service == null || input.service === '' ? undefined : String(input.service) as TicketService;
    if (service && !Object.values(TicketService).includes(service)) invalid('service', 'Categoría no válida.');
    const status = input.status == null || input.status === '' ? undefined : String(input.status) as TicketStatus;
    if (status && !Object.values(TicketStatus).includes(status)) invalid('status', 'Estado no válido.');

    const scope = input.scope == null || input.scope === '' ? (hasInstitution ? 'institution' : 'team') : input.scope;
    if (scope !== 'institution' && scope !== 'team') invalid('scope', 'Alcance no válido.');
    if (scope === 'institution' && !hasInstitution) invalid('scope', 'No tienes alcance institucional.');
    if (scope === 'team' && !hasTeam) invalid('scope', 'No tienes permiso de reportes por equipo.');
    if (scope === 'team' && !actor.teamId) invalid('scope', 'No tienes un equipo asignado.');

    return { from, to, period: period as ReportQuery['period'], service, status, scope };
  }

  private async rows(actor: CampusPrincipal, q: ReportQuery) {
    if (q.scope === 'institution') requirePermission(actor, 'reports:read:institution');
    else requirePermission(actor, 'reports:read:team');

    const where: Prisma.TicketWhereInput = {
      institutionId: actor.institutionId,
      createdAt: { gte: q.from, lte: q.to },
      ...(q.service ? { service: q.service } : {}),
      ...(q.status ? { status: q.status } : {}),
    };
    if (q.scope === 'team') where.owner = { teamId: actor.teamId };
    return this.db.ticket.findMany({
      where,
      select: {
        id: true,
        code: true,
        service: true,
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
        resolutionDueAt: true,
        failureConfirmed: true,
        isDemo: true,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async report(actor: CampusPrincipal, raw: unknown) {
    const q = this.query(actor, raw);
    const rows = await this.rows(actor, q);
    const categoryMap = new Map<TicketService, number>();
    for (const row of rows) categoryMap.set(row.service, (categoryMap.get(row.service) ?? 0) + 1);
    const categories = Object.values(TicketService).map(service => {
      const count = categoryMap.get(service) ?? 0;
      return {
        service,
        label: serviceLabels[service],
        count,
        percentage: rows.length ? Math.round(count * 1000 / rows.length) / 10 : null,
      };
    }).filter(item => item.count > 0);

    const first = periodStart(q.from, q.period);
    const last = periodStart(q.to, q.period);
    const seriesMap = new Map<string, number>();
    for (let cursor = first; cursor <= last; cursor = addPeriod(cursor, q.period)) {
      seriesMap.set(cursor.toISOString().slice(0, 10), 0);
    }
    for (const row of rows) {
      const key = periodKey(row.createdAt, q.period);
      if (seriesMap.has(key)) seriesMap.set(key, (seriesMap.get(key) ?? 0) + 1);
    }
    const series = [...seriesMap.entries()].map(([period, observed]) => ({
      period,
      observed,
      forecast: null as null,
    }));

    const registered = rows.filter(row => row.status === 'registrado').length;
    const inAttention = rows.filter(row => row.status === 'en_atencion').length;
    const resolved = rows.filter(row => row.status === 'resuelto').length;
    const resolvedWithDue = rows.filter(row => row.status === 'resuelto' && row.resolvedAt && row.resolutionDueAt);
    const resolvedWithinSla = resolvedWithDue.filter(row => row.resolvedAt!.getTime() <= row.resolutionDueAt!.getTime()).length;

    return {
      series,
      categories,
      total: rows.length,
      registered,
      inAttention,
      resolved,
      resolutionRate: rows.length ? Math.round(resolved * 1000 / rows.length) / 10 : null,
      resolvedWithinSlaRate: resolvedWithDue.length ? Math.round(resolvedWithinSla * 1000 / resolvedWithDue.length) / 10 : null,
      source: 'tickets-operational' as const,
      synthetic: rows.some(row => row.isDemo),
      forecastStatus: 'unavailable' as const,
      forecastMessage: 'Este reporte muestra el histórico operativo filtrado. El pronóstico institucional se consulta por separado en Demanda y Modelos; todavía no se combina con estos filtros.',
      filters: {
        from: q.from.toISOString(),
        to: q.to.toISOString(),
        period: q.period,
        service: q.service,
        status: q.status,
        scope: q.scope,
      },
    };
  }

  async export(actor: CampusPrincipal, raw: unknown) {
    const report = await this.report(actor, raw);
    const escape = (value: unknown) => `"${value == null ? '' : String(value).replace(/[\r\n]/g, ' ').replace(/"/g, '""')}"`;
    const lines = [
      ['periodo', 'observado', 'pronosticado', 'origen', 'fuente_sintetica'].join(','),
      ...report.series.map(item => [
        item.period,
        item.observed,
        '',
        report.source,
        report.synthetic,
      ].map(escape).join(',')),
      [],
      ['categoria', 'cantidad', 'porcentaje'].join(','),
      ...report.categories.map(item => [item.label, item.count, item.percentage == null ? '' : item.percentage].map(escape).join(',')),
    ];
    return lines.join('\r\n');
  }
}
