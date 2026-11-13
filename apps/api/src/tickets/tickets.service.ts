import { ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma, Ticket, TicketService } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { CampusPrincipal } from '../auth/auth.policy';
import { PrismaService } from '../database/prisma.service';
import { invalid, uuid } from '../academic/academic.validation';
import { createTicketInput, ticketsQuery } from './tickets.validation';

const labels: Record<TicketService, string> = {
  aula_virtual: 'Aula virtual', wifi_red: 'Wi-Fi/red', correo: 'Correo institucional',
  equipos: 'Equipo de cómputo', impresoras: 'Impresora', cuentas_accesos: 'Cuentas y accesos',
  videoconferencia: 'Videoconferencia', sistemas_institucionales: 'Sistemas institucionales',
  almacenamiento_nube: 'Almacenamiento/nube', software_licencias: 'Software/licencias', otro: 'Otro servicio',
};
export const ticketResponse = (t: Ticket, operational = false) => ({
  id: t.id, code: t.code, description: t.description, service: t.service, scope: t.scope,
  courseId: t.courseId, sectionId: t.sectionId, status: t.status,
  classificationStatus: t.classificationStatus, priority: t.priority ?? null,
  version: t.version, academicContext: t.academicContext, academicFactor: t.academicFactor,
  ...(operational ? { urgency:t.urgency, impact:t.impact, technicalScore:t.technicalScore, score:t.score } : {}),
  responseDueAt:t.responseDueAt?.toISOString()??null, resolutionDueAt:t.resolutionDueAt?.toISOString()??null,
  firstResponseAt:t.firstResponseAt?.toISOString()??null, resolvedAt:t.resolvedAt?.toISOString()??null,
  solution:t.solution, failureConfirmed:t.failureConfirmed, assigneeId:t.assigneeId, isDemo:t.isDemo,
  createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
});
const uniqueOn = (error: unknown, field: string) => error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002' && String(error.meta?.target ?? '').includes(field);

@Injectable()
export class TicketsService {
  constructor(private readonly db: PrismaService) {}
  services() { return Object.values(TicketService).map(id => ({ id, label: labels[id] })); }

  private async academicAccess(principal: CampusPrincipal, input: ReturnType<typeof createTicketInput>) {
    if (input.scope === 'general') return;
    const course = await this.db.academicCourse.findFirst({
      where: { id: input.courseId!, institutionId: principal.institutionId }, select: { id: true },
    });
    if (!course) invalid('courseId', 'El curso no está disponible en tu institución.');
    if (input.sectionId) {
      const section = await this.db.academicSection.findFirst({
        where: { id: input.sectionId, courseId: input.courseId!, institutionId: principal.institutionId }, select: { id: true },
      });
      if (!section) invalid('sectionId', 'La sección no pertenece a este curso.');
    }
    const membership = await this.db.academicMembership.findFirst({
      where: { institutionId: principal.institutionId, courseId: input.courseId!,
        subjectId: principal.id, ...(input.sectionId ? { sectionId: input.sectionId } : {}) }, select: { sectionId: true },
    });
    if (!membership) invalid(input.sectionId ? 'sectionId' : 'courseId', 'No tienes una asociación académica válida.');
  }

  async create(principal: CampusPrincipal, body: unknown, key: unknown) {
    const input = createTicketInput(body);
    const idempotencyKey = uuid(key, 'Idempotency-Key');
    const requestHash = createHash('sha256').update(JSON.stringify([
      input.description, input.service, input.scope, input.courseId, input.sectionId,
    ])).digest('hex');
    const identity = { institutionId: principal.institutionId, ownerId: principal.id, idempotencyKey };
    const existing = await this.db.ticket.findUnique({ where: { institutionId_ownerId_idempotencyKey: identity } });
    if (existing) return this.replayed(existing, requestHash);
    await this.academicAccess(principal, input);
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = `INC-${new Date().getUTCFullYear()}-${randomBytes(12).toString('hex').toUpperCase()}`;
      try {
        // Una inserción es atómica. Tras P2002 se consulta fuera de la transacción fallida.
        const ticket = await this.db.ticket.create({ data: { ...identity, ...input, code, requestHash } });
        return { created: true, ticket: ticketResponse(ticket) };
      } catch (error) {
        if (uniqueOn(error, 'idempotencyKey')) {
          for (let read = 0; read < 3; read++) {
            const winner = await this.db.ticket.findUnique({ where: { institutionId_ownerId_idempotencyKey: identity } });
            if (winner) return this.replayed(winner, requestHash);
            await new Promise(resolve => setTimeout(resolve, 25 * (read + 1)));
          }
          throw new ServiceUnavailableException({ code: 'DEPENDENCY_UNAVAILABLE', message: 'Reintenta con la misma Idempotency-Key.' });
        }
        if (uniqueOn(error, 'code')) continue;
        throw error;
      }
    }
    throw new ServiceUnavailableException({ code: 'DEPENDENCY_UNAVAILABLE', message: 'No se pudo generar un código único. Reintenta con la misma clave.' });
  }
  private replayed(ticket: Ticket, requestHash: string) {
    if (ticket.requestHash !== requestHash) throw new ConflictException({ code: 'IDEMPOTENCY_CONFLICT', message: 'La clave ya se usó para otro contenido.' });
    return { created: false, ticket: ticketResponse(ticket) };
  }

  async list(principal: CampusPrincipal, raw: unknown) {
    const { page, pageSize, status, search } = ticketsQuery(raw);
    const where: Prisma.TicketWhereInput = { institutionId: principal.institutionId, ownerId: principal.id,
      ...(status ? { status } : {}),
      ...(search ? { OR: [{ code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }] } : {}) };
    const [items, total] = await this.db.$transaction([
      this.db.ticket.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize, take: pageSize }), this.db.ticket.count({ where }),
    ]);
    return { items: items.map(t => ticketResponse(t)), total, page, pageSize };
  }
  async get(principal: CampusPrincipal, id: unknown) {
    const ticketId = uuid(id, 'id');
    const ticket = await this.db.ticket.findFirst({ where: { id: ticketId,
      institutionId: principal.institutionId, ownerId: principal.id }, include:{course:{select:{name:true}},changes:{orderBy:[{createdAt:'asc'},{id:'asc'}]}} });
    if (!ticket) throw new NotFoundException({ code: 'NOT_FOUND', message: 'No se encontró el ticket.' });
    return {...ticketResponse(ticket),courseName:ticket.course?.name,changes:ticket.changes.map(c=>({id:c.id,action:c.action,note:c.note,createdAt:c.createdAt.toISOString()}))};
  }
}
