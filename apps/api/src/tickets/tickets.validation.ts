import { TicketScope, TicketService, TicketStatus } from '@prisma/client';
import { invalid, object, positive, text, uuid } from '../academic/academic.validation';

export function createTicketInput(value: unknown) {
  const body = object(value);
  const allowed = ['description', 'service', 'scope', 'courseId', 'sectionId'];
  for (const key of Object.keys(body)) if (!allowed.includes(key)) invalid(key, 'Campo no admitido.');
  const description = text(body.description, 'description', 5000, 20);
  if (typeof body.service !== 'string' || !Object.values(TicketService).includes(body.service as TicketService)) invalid('service', 'Selecciona un servicio válido.');
  if (typeof body.scope !== 'string' || !Object.values(TicketScope).includes(body.scope as TicketScope)) invalid('scope', 'Selecciona un alcance válido.');
  if (!Object.hasOwn(body, 'courseId') || !Object.hasOwn(body, 'sectionId')) invalid('scope', 'Indica curso y sección, usando null cuando no corresponda.');
  const courseId = body.courseId === null ? null : uuid(body.courseId, 'courseId');
  const sectionId = body.sectionId === null ? null : uuid(body.sectionId, 'sectionId');
  if (body.scope === 'general' && (courseId !== null || sectionId !== null)) invalid('scope', 'Un reporte general no lleva curso ni sección.');
  if (body.scope === 'curso' && !courseId) invalid('courseId', 'Selecciona un curso.');
  return { description, service: body.service as TicketService, scope: body.scope as TicketScope, courseId, sectionId };
}
export function ticketsQuery(value: unknown) {
  const q = object(value);
  const page = q.page === undefined ? 1 : positive(q.page, 'page', 100000);
  const pageSize = q.pageSize === undefined ? 20 : positive(q.pageSize, 'pageSize', 100);
  const status = q.status === undefined ? undefined : text(q.status, 'status') as TicketStatus;
  if (status && !Object.values(TicketStatus).includes(status)) invalid('status', 'Estado no válido.');
  const search = q.search === undefined ? undefined : text(q.search, 'search', 100);
  return { page, pageSize, status, search };
}
