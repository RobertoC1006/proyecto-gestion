// Evaluación solo de Groq con textos ficticios; no abre PostgreSQL ni registra claves.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { classifyWithGroq, technicalDescription, GROQ_MODEL, GROQ_ADAPTER_VERSION } = require('../dist/tickets/groq-ticket.adapter');
const dataset = JSON.parse(readFileSync(join(__dirname, 'fixtures/ticket-ai-evaluation.json'), 'utf8'));
const split = process.argv[2] || 'holdout';
if (!['development', 'holdout', 'holdout2'].includes(split)) throw Error('Usa development, holdout o holdout2.');
if (!process.env.GROQ_API_KEY) throw Error('Falta GROQ_API_KEY; no se ejecutó la evaluación.');

(async () => {
  const rows = [];
  for (const item of dataset[split]) {
    const projection = technicalDescription(item.text);
    if (/12345678|999111222|ejemplo@example\.test|Persona Ficticia|demo@example\.test|Nombre Prueba/i.test(projection)) throw Error(`Proyección privada fallida: ${item.id}`);
    const start = performance.now();
    try {
      const actual = await classifyWithGroq(item.text);
      rows.push({ id: item.id, expected: item.service, actual: actual.service,
        urgencyExpected: item.urgency, urgencyActual: actual.urgency,
        impactExpected: item.impact, impactActual: actual.impact,
        latencyMs: Math.round(performance.now() - start), outcome: 'valid' });
    } catch (error) {
      rows.push({ id: item.id, expected: item.service, actual: null,
        urgencyExpected: item.urgency, urgencyActual: null,
        impactExpected: item.impact, impactActual: null,
        latencyMs: Math.round(performance.now() - start), outcome: error.code || 'unavailable' });
    }
  }
  const evaluated = rows.filter(row => row.expected !== null);
  const valid = rows.filter(row => row.outcome === 'valid');
  const matrix = {};
  for (const row of rows) {
    const expected = row.expected ?? 'revision_manual', actual = row.actual ?? 'revision_manual';
    matrix[expected] ??= {}; matrix[expected][actual] = (matrix[expected][actual] ?? 0) + 1;
  }
  const latencies = rows.map(row => row.latencyMs).sort((a, b) => a - b);
  const modelLatencies = valid.map(row => row.latencyMs).sort((a, b) => a - b);
  const failureCodes = {};
  for (const row of rows.filter(row => row.outcome !== 'valid')) {
    failureCodes[row.outcome] = (failureCodes[row.outcome] ?? 0) + 1;
  }
  console.log(JSON.stringify({ split, cases: rows.length, categories: [...new Set(evaluated.map(row => row.expected))],
    provider: 'groq', model: GROQ_MODEL, adapterVersion: GROQ_ADAPTER_VERSION,
    measuredAt: new Date().toISOString(), rubric: dataset.rubric,
    serviceCorrectAll: rows.filter(row => row.actual === row.expected).length,
    serviceCorrectClassifiable: evaluated.filter(row => row.actual === row.expected).length,
    classifiableCases: evaluated.length,
    urgencyCorrectAll: rows.filter(row => row.urgencyActual === row.urgencyExpected).length,
    urgencyCorrectClassifiable: evaluated.filter(row => row.urgencyActual === row.urgencyExpected).length,
    impactCorrectAll: rows.filter(row => row.impactActual === row.impactExpected).length,
    impactCorrectClassifiable: evaluated.filter(row => row.impactActual === row.impactExpected).length,
    validResponses: valid.length, failureCodes,
    reviewExpected: rows.filter(row => row.expected === null).length,
    reviewActual: rows.filter(row => row.actual === null).length,
    p50LatencyMs: latencies[Math.floor((latencies.length - 1) * 0.5)],
    p95LatencyMs: latencies[Math.floor((latencies.length - 1) * 0.95)],
    p50ValidLatencyMs: modelLatencies[Math.floor((modelLatencies.length - 1) * 0.5)] ?? null,
    p95ValidLatencyMs: modelLatencies[Math.floor((modelLatencies.length - 1) * 0.95)] ?? null,
    matrix, rows }, null, 2));
})().catch(() => { console.error('No se pudo completar la evaluación.'); process.exitCode = 1; });
