import { BadRequestException } from '@nestjs/common';

export function invalid(field: string, message: string): never {
  throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Revisa los campos indicados.', fields: { [field]: message } });
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('body', 'Envía un objeto válido.');
  return value as Record<string, unknown>;
}
export function text(value: unknown, field: string, max = 160, min = 1): string {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) invalid(field, `Usa entre ${min} y ${max} caracteres.`);
  return value.trim();
}
export function uuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) invalid(field, 'Selecciona un valor válido.');
  return value.toLowerCase();
}
export function date(value: unknown, field: string): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value)) invalid(field, 'Indica fecha y hora con zona horaria.');
  const result = new Date(value);
  // Date.parse normaliza algunas fechas imposibles: comprobar el día del calendario local.
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const [hour, minute, second = '0'] = value.slice(11).split(/[:Z+\-]/);
  if (!Number.isFinite(result.getTime()) || month < 1 || month > 12 || day < 1 || day > maxDay || Number(hour) > 23 || Number(minute) > 59 || Number(second) >= 60) invalid(field, 'La fecha no es válida.');
  return result;
}
export function positive(value: unknown, field: string, max = Number.MAX_SAFE_INTEGER): number {
  const result = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof result !== 'number' || !Number.isInteger(result) || result < 1 || result > max) invalid(field, `Usa un entero entre 1 y ${max}.`);
  return result;
}
export function reason(body: Record<string, unknown>) { return text(body.reason, 'reason', 500, 5); }
export function eventInput(value: unknown) {
  const body = object(value);
  const title = text(body.title, 'title');
  const type = text(body.type, 'type');
  if (!['examen', 'entrega', 'matricula'].includes(type)) invalid('type', 'Selecciona el tipo de evento.');
  const scope = text(body.scope, 'scope');
  if (!['institution', 'course', 'section'].includes(scope)) invalid('scope', 'Selecciona un alcance válido.');
  const courseId = body.courseId == null || body.courseId === '' ? null : uuid(body.courseId, 'courseId');
  const sectionId = body.sectionId == null || body.sectionId === '' ? null : uuid(body.sectionId, 'sectionId');
  if ((scope === 'institution' && (courseId || sectionId)) || (scope === 'course' && (!courseId || sectionId)) || (scope === 'section' && (!courseId || !sectionId))) invalid('scope', 'El curso y la sección deben coincidir con el alcance.');
  const startsAt = date(body.startsAt, 'startsAt');
  const endsAt = date(body.endsAt, 'endsAt');
  if (endsAt <= startsAt) invalid('endsAt', 'El fin debe ser posterior al inicio.');
  return { title, type: type as 'examen' | 'entrega' | 'matricula', scope: scope as 'institution' | 'course' | 'section', courseId, sectionId, startsAt, endsAt, reason: reason(body) };
}
export function listInput(value: unknown, dates = false) {
  const q = object(value);
  const page = q.page == null ? 1 : positive(q.page, 'page', 100000);
  const pageSize = q.pageSize == null ? 100 : positive(q.pageSize, 'pageSize', 100);
  const courseId = q.courseId ? uuid(q.courseId, 'courseId') : undefined;
  const sectionId = q.sectionId ? uuid(q.sectionId, 'sectionId') : undefined;
  const type = q.type ? text(q.type, 'type') : undefined;
  if (type && !['examen', 'entrega', 'matricula'].includes(type)) invalid('type', 'Tipo de evento no válido.');
  const from = dates ? date(q.from, 'from') : undefined;
  const to = dates ? date(q.to, 'to') : undefined;
  if (from && to && (to <= from || to.getTime() - from.getTime() > 93 * 86400000)) invalid('to', 'Consulta un intervalo de hasta 93 días, con fin posterior al inicio.');
  return { page, pageSize, courseId, sectionId, type: type as 'examen' | 'entrega' | 'matricula' | undefined, from, to };
}
