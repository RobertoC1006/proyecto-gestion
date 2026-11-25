import { invalid } from './academic.validation';

export const csvHeader = ['title', 'type', 'scope', 'courseCode', 'sectionCode', 'startsAt', 'endsAt'];
// RFC 4180: escaped quotes and embedded newlines; reject malformed records.
export function parseCalendarCsv(value: unknown): string[][] {
  if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') > 48 * 1024) invalid('csv', 'Selecciona un CSV UTF-8 de hasta 48 KiB.');
  const input = value.replace(/^\uFEFF/, '');
  const rows: string[][] = []; let row: string[] = [], field = '', quoted = false, closed = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === ',') { row.push(field); field = ''; closed = false; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && input[i + 1] === '\n') i++;
      row.push(field); if (row.some(s => s.trim())) rows.push(row);
      row = []; field = ''; closed = false;
    } else if (c === '"' && field === '' && !closed) quoted = true;
    else { if (closed || c === '"') invalid('csv', 'Comillas incorrectas en el CSV.'); field += c; }
  }
  if (quoted) invalid('csv', 'Hay comillas sin cerrar en el CSV.');
  row.push(field); if (row.some(s => s.trim())) rows.push(row);
  if (rows.length < 2 || rows.length > 501 || rows[0].map(s => s.trim()).join(',') !== csvHeader.join(',')) invalid('csv', `Incluye la cabecera ${csvHeader.join(',')} y entre 1 y 500 eventos.`);
  return rows.slice(1);
}
