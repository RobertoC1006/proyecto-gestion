require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Test } = require('@nestjs/testing');
const { AuthController } = require('../dist/auth/auth.controller');
const { AuthService } = require('../dist/auth/auth.service');
const { registerCertificateVerificationBodyParser } = require('../dist/certificates/certificates.upload');
const { registerTicketAttachmentBodyParser } = require('../dist/tickets/ticket-attachment.parser');
const express = require('express');

test('El parser de PDF no impide leer los campos JSON de login en el arranque Nest', async () => {
  const module = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [{ provide: AuthService, useValue: {
      login: (_request, _response, body) => ({ email: body?.email, passwordPresent: typeof body?.password === 'string' && body.password.length > 0 }),
    } }],
  }).compile();
  const app = module.createNestApplication({ logger: false });
  registerTicketAttachmentBodyParser(app);
  registerCertificateVerificationBodyParser(app);
  app.setGlobalPrefix('api/v1');
  await app.listen(0, '127.0.0.1');
  try {
    const response = await fetch(`${await app.getUrl()}/api/v1/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fixture@example.test', password: 'fixture-only' }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { email: 'fixture@example.test', passwordPresent: true });
  } finally { await app.close(); }
});

test('Solo PUT de evidencia acepta el cuerpo ampliado y devuelve 413 normalizado', async () => {
  const app = express();
  registerTicketAttachmentBodyParser(app);
  registerCertificateVerificationBodyParser(app);
  app.put('/api/v1/tickets/:ticketId/attachment', (request, response) => response.json({ length: request.body?.contentBase64?.length }));
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/v1/tickets/44444444-4444-4444-8444-444444444444/attachment`;
  try {
    const accepted = await fetch(base, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contentBase64: 'A'.repeat(120_000) }) });
    assert.equal(accepted.status, 200);
    assert.equal((await accepted.json()).length, 120_000);
    const oversized = await fetch(base, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contentBase64: 'A'.repeat(7_400_000) }) });
    assert.equal(oversized.status, 413);
    assert.equal((await oversized.json()).code, 'FILE_TOO_LARGE');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
