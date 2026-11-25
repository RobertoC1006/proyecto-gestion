const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classifyWithGroq, validateProposal } = require('../dist/tickets/groq-ticket.adapter');
const { TicketAiService } = require('../dist/tickets/ticket-ai.service');

const proposal = { service: 'aula_virtual', urgency: 3, impact: 2,
  explanation: 'El acceso al aula virtual impide una actividad.' };

test('Groq recibe solo el texto y devuelve una propuesta validada', async () => {
  let sent;
  const result = await classifyWithGroq('No puedo entrar al aula virtual.', 'test-key', async (_url, options) => {
    sent = JSON.parse(options.body);
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(proposal) } }] }) };
  });
  assert.deepEqual(result, proposal);
  assert.equal(sent.model, 'openai/gpt-oss-20b');
  assert.equal(sent.messages[1].content, 'No puedo entrar al aula virtual.');
  assert.equal(sent.response_format.json_schema.strict, true);
  assert.equal(JSON.stringify(sent).includes('test-key'), false);
});

test('Rechaza una escala o categoría ajena al contrato', () => {
  assert.throws(() => validateProposal({ ...proposal, urgency: 4 }), { code: 'invalid_response' });
  assert.throws(() => validateProposal({ ...proposal, service: 'inventado' }), { code: 'invalid_response' });
});

test('Cuota agotada y falta de clave derivan a revisión', async () => {
  await assert.rejects(classifyWithGroq('Reporte', '', async () => { throw Error('No debe llamar'); }),
    { code: 'not_configured' });
  await assert.rejects(classifyWithGroq('Reporte', 'test-key', async () => ({ status: 429, ok: false })),
    { code: 'rate_limited' });
});

test('La respuesta tardía no modifica un ticket corregido por TI', async () => {
  const ticket = { id: 'ticket-1', version: 1, description: 'Falla del aula virtual' };
  const corrected = { ...ticket, version: 2, classificationStatus: 'manual' };
  const db = { $transaction: async fn => fn({
    $queryRaw: async () => [], ticket: { findUniqueOrThrow: async () => corrected,
      update: async () => { throw Error('No debe sobrescribir TI'); } },
  }) };
  const result = await new TicketAiService(db, {}).classify(ticket);
  assert.equal(result, corrected);
});
