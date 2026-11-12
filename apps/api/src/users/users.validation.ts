import { CampusRole } from '@prisma/client';
import { invalid, object, positive, text, uuid } from '../academic/academic.validation';

export function usersQuery(value: unknown) {
  const query = object(value);
  const allowed = ['page', 'pageSize', 'role', 'active', 'teamId', 'search'];
  for (const key of Object.keys(query)) if (!allowed.includes(key)) invalid(key, 'Campo no admitido.');
  const page = query.page === undefined ? 1 : positive(query.page, 'page', 100000);
  const pageSize = query.pageSize === undefined ? 20 : positive(query.pageSize, 'pageSize', 100);
  let role: CampusRole | undefined;
  if (query.role !== undefined) {
    if (typeof query.role !== 'string' || !Object.values(CampusRole).includes(query.role as CampusRole)) invalid('role', 'Selecciona un rol válido.');
    role = query.role as CampusRole;
  }
  let active: boolean | undefined;
  if (query.active !== undefined) {
    if ([true, 'true', '1'].includes(query.active as boolean | string)) active = true;
    else if ([false, 'false', '0'].includes(query.active as boolean | string)) active = false;
    else invalid('active', 'Indica true o false.');
  }
  const teamId = query.teamId === undefined ? undefined : uuid(query.teamId, 'teamId');
  const search = query.search === undefined ? undefined : text(query.search, 'search', 100, 0) || undefined;
  return { page, pageSize, role, active, teamId, search };
}
