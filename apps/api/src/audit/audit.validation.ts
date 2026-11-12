import { BadRequestException } from '@nestjs/common';
import { uuid, date, object, positive, text } from '../academic/academic.validation';

const invalid = (field: string, message: string): never => {
  throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Revisa los campos indicados.', fields: { [field]: message } });
};

export function auditQuery(value: unknown) {
  const q = object(value);
  const allowed = ['page', 'pageSize', 'from', 'to', 'actorId', 'objectType', 'objectId', 'action'];
  for (const key of Object.keys(q)) if (!allowed.includes(key)) invalid(key, 'Campo no admitido.');
  const page = q.page == null ? 1 : positive(q.page, 'page', 100000);
  const pageSize = q.pageSize == null ? 20 : positive(q.pageSize, 'pageSize', 100);
  const from = q.from == null || q.from === '' ? undefined : date(q.from, 'from');
  const to = q.to == null || q.to === '' ? undefined : date(q.to, 'to');
  if (from && to && to <= from) invalid('to', 'Debe ser posterior a from.');
  const actorId = q.actorId == null || q.actorId === '' ? undefined : uuid(q.actorId, 'actorId');
  const objectId = q.objectId == null || q.objectId === '' ? undefined : uuid(q.objectId, 'objectId');
  const objectType = q.objectType == null || q.objectType === '' ? undefined : text(q.objectType, 'objectType', 40);
  const action = q.action == null || q.action === '' ? undefined : text(q.action, 'action', 40);
  return { page, pageSize, from, to, actorId, objectType, objectId, action };
}
