import type { components } from './schema';
import { request, ApiError } from './http';
export { ApiError } from './http';

export type AcademicEvent = components['schemas']['EventDto'];
export type Course = components['schemas']['CourseDto'];
export type Section = components['schemas']['SectionDto'];
export type EventInput = components['schemas']['EventInputDto'];
export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(`academic/${path}`, options);
}
// Se recorren las páginas: ningún curso ni evento se oculta al superar 100 filas.
export async function allPages<T>(path: string): Promise<T[]> {
  let page = 1;
  const items: T[] = [];
  do {
    const result = await api<Page<T>>(`${path}${path.includes('?') ? '&' : '?'}page=${page}&pageSize=100`);
    items.push(...result.items);
    if (items.length >= result.total || result.items.length === 0) return items;
    page++;
  } while (page <= 1000);
  throw new ApiError(400, 'TOO_MANY_RESULTS', 'Selecciona un intervalo o filtro más específico.');
}
