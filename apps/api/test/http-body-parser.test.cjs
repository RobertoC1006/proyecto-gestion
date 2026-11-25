require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Test } = require('@nestjs/testing');
const { AuthController } = require('../dist/auth/auth.controller');
const { AuthService } = require('../dist/auth/auth.service');
const { registerCertificateVerificationBodyParser } = require('../dist/certificates/certificates.upload');

test('El parser de PDF no impide leer los campos JSON de login en el arranque Nest', async () => {
  const module = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [{ provide: AuthService, useValue: {
      login: (_request, _response, body) => ({ email: body?.email, passwordPresent: typeof body?.password === 'string' && body.password.length > 0 }),
    } }],
  }).compile();
  const app = module.createNestApplication({ logger: false });
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
