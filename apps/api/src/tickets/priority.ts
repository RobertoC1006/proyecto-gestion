import { invalid, object, positive } from '../academic/academic.validation';

export const defaultRules = [
 { priority: 'P1', threshold: 9, responseMinutes: 15, resolutionMinutes: 120 },
 { priority: 'P2', threshold: 5, responseMinutes: 60, resolutionMinutes: 240 },
 { priority: 'P3', threshold: 3, responseMinutes: 240, resolutionMinutes: 1440 },
 { priority: 'P4', threshold: 0, responseMinutes: 480, resolutionMinutes: 4320 },
];
export type Rule = typeof defaultRules[number];
export function policyInput(input: unknown): Rule[] {
 if (!Array.isArray(input) || input.length !== 4) invalid('rules', 'Configura las cuatro prioridades.');
 const rules = input.map((value, i) => {
  const row = object(value);
  if (row.priority !== `P${i + 1}` || !Number.isInteger(row.threshold) || Number(row.threshold) < 0 || Number(row.threshold) > 18) invalid('rules', 'Revisa las prioridades y sus umbrales.');
  const responseMinutes = positive(row.responseMinutes, 'responseMinutes', 43200);
  const resolutionMinutes = positive(row.resolutionMinutes, 'resolutionMinutes', 43200);
  if (resolutionMinutes < responseMinutes) invalid('rules', 'La resolución no puede vencer antes de la respuesta.');
  return { priority: String(row.priority), threshold: Number(row.threshold), responseMinutes, resolutionMinutes };
 });
 if (rules[3].threshold !== 0 || rules.some((r, i) => i < 3 && r.threshold <= rules[i + 1].threshold)) invalid('rules', 'Los umbrales deben descender y P4 empezar en cero.');
 return rules;
}
export function calculate(urgency: number, impact: number, factor: number, rules: Rule[]) {
 const technicalScore = urgency * impact;
 const score = Math.round(technicalScore * factor * 100) / 100;
 return { technicalScore, score, rule: rules.find(r => score >= r.threshold)! };
}
export function contextualFactor(events: { id: string; title: string; type: string; startsAt: Date; endsAt: Date }[], at: Date) {
 const eligible = events.map(e => {
  const until = e.startsAt.getTime() - at.getTime();
  const factor = e.type === 'examen' && e.endsAt > at && until < 86400000 ? 2
   : e.type === 'entrega' && until > 0 && until < 172800000 ? 1.5
   : e.type === 'matricula' && e.startsAt <= at && e.endsAt > at ? 1.7 : 1;
  return { eventId: e.id, title: e.title, type: e.type, startsAt: e.startsAt.toISOString(), endsAt: e.endsAt.toISOString(), factor };
 }).filter(e => e.factor > 1).sort((a,b) => b.factor-a.factor || a.startsAt.localeCompare(b.startsAt) || a.eventId.localeCompare(b.eventId));
 return { factor: eligible[0]?.factor ?? 1, reason: eligible[0]?.title ?? 'Actividad regular', event: eligible[0] ?? null, evaluatedAt: at.toISOString() };
}
