export const zone = 'America/Lima';
export const dayKey = (value: Date | string) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
export const time = (value: string) => new Intl.DateTimeFormat('es-PE', { timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
export const localInput = (value: string) => `${dayKey(value)}T${time(value)}`;
export const utcInput = (value: string) => new Date(`${value}:00-05:00`).toISOString();
export function addDays(day: string, count: number) { return new Date(new Date(`${day}T12:00:00Z`).getTime() + count * 86400000).toISOString().slice(0, 10); }
export function monday(day: string) { const dow = new Date(`${day}T12:00:00Z`).getUTCDay(); return addDays(day, -(dow === 0 ? 6 : dow - 1)); }
export function weekLabel(start: string) {
  const from = new Date(`${start}T12:00:00Z`), to = new Date(`${addDays(start, 6)}T12:00:00Z`);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', timeZone: zone };
  return `${from.getUTCDate()} – ${to.toLocaleDateString('es-PE', options)}`;
}
export const dateLabel = (value: string) => new Date(value).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: zone });
