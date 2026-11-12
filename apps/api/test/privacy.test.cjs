require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { Test } = require('@nestjs/testing');
const { UnauthorizedException } = require('@nestjs/common');
const { AppModule } = require('../dist/app.module');
const { AuthProvider } = require('../dist/auth/auth.provider');
const { AuthConfig } = require('../dist/auth/auth.config');
const { PrismaService } = require('../dist/database/prisma.service');

test('Privacidad: consentimiento idempotente y auditoría aislada', async t => {
  assert.equal(new URL(process.env.DATABASE_URL).hostname, 'db');
  const institutionId = randomUUID(), foreignInstitution = randomUUID();
  const identities = new Map(), tokens = new Map();
  const config = new AuthConfig();
  Object.defineProperty(config, 'institutionCode', { value: 'PRIVACY-TEST' });
  const provider = {
    async login(email) {
      const user = identities.get(email);
      if (!user) throw new UnauthorizedException();
      const access = randomBytes(24).toString('hex');
      tokens.set(access, user);
      return { access, refresh: 'isolated-test', expiresAt: Math.floor(Date.now() / 1000) + 3600 };
    },
    async validate(token) { const user = tokens.get(token); if (!user) throw new UnauthorizedException(); return user; },
    async revoke() {},
  };
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AuthProvider).useValue(provider)
    .overrideProvider(AuthConfig).useValue(config).compile();
  const app = module.createNestApplication({ logger: false });
  app.setGlobalPrefix('api/v1');
  await app.listen(0, '127.0.0.1');
  const db = app.get(PrismaService), base = await app.getUrl();
  const admin = { id: randomUUID(), email: 'privacy-admin@example.test', displayName: 'Admin Privacidad', role: 'administrador' };
  const student = { id: randomUUID(), email: 'privacy-student@example.test', displayName: 'Estudiante Privacidad', role: 'estudiante' };
  const foreign = { id: randomUUID(), email: 'privacy-foreign@example.test', displayName: 'Otra Institución', role: 'administrador' };
  for (const user of [admin, student, foreign]) identities.set(user.email, user);
  async function request(path, { method = 'GET', body, session, headers = {} } = {}) {
    const response = await fetch(`${base}/api/v1/${path}`, { method, headers: { origin: 'http://localhost:8080', 'content-type': 'application/json', ...(session ? { cookie: session.cookie, 'x-csrf-token': session.csrf } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  async function login(user) {
    const result = await request('auth/login', { method: 'POST', body: { email: user.email, password: 'Password-test-123' } });
    assert.equal(result.status, 200);
    return { cookie: result.cookie.split(';')[0], csrf: result.body.csrfToken };
  }
  let adminSession, studentSession;
  try {
    await db.institution.createMany({ data: [{ id: institutionId, code: 'PRIVACY-TEST', name: 'Privacidad prueba' }, { id: foreignInstitution, code: 'PRIVACY-OTHER', name: 'Otra institución' }] });
    await db.appUser.createMany({ data: [{ ...admin, institutionId }, { ...student, institutionId }, { ...foreign, institutionId: foreignInstitution }] });
    const version = await db.consentVersion.create({ data: { version: '1.0', title: 'Política de privacidad', summary: 'Uso autorizado para la operación de soporte.', effectiveAt: new Date(Date.now() - 1000) } });
    adminSession = await login(admin); studentSession = await login(student);
    await t.test('La aceptación requiere acción y es idempotente', async () => {
      assert.equal((await request('consent/me', { session: studentSession })).body.acceptance, null);
      const accepted = await request('consent/accept', { method: 'POST', body: {}, session: studentSession });
      assert.equal([200, 201].includes(accepted.status), true); assert.equal(accepted.body.version, version.version);
      const duplicate = await request('consent/accept', { method: 'POST', body: {}, session: studentSession });
      assert.equal([200, 201].includes(duplicate.status), true); assert.equal(duplicate.body.id, accepted.body.id);
      assert.equal(await db.consentAcceptance.count({ where: { userId: student.id } }), 1);
    });
    await t.test('Auditoría exige permiso y filtra por institución, acción y página', async () => {
      assert.equal((await request('audit', { session: studentSession })).status, 403);
      const first = await request('audit?action=consent.accept&page=1&pageSize=1', { session: adminSession });
      assert.equal(first.status, 200); assert.equal(first.body.total, 1); assert.equal(first.body.items.length, 1);
      assert.equal(first.body.items[0].actor, student.displayName);
      assert.equal(first.body.items[0].after.email, undefined);
      assert.equal((await request('audit?actorId=' + foreign.id, { session: adminSession })).body.total, 0);
    });
  } finally {
    await db.consentAcceptance.deleteMany({ where: { institutionId: { in: [institutionId, foreignInstitution] } } });
    await db.consentVersion.deleteMany({ where: { version: '1.0' } });
    await db.appUser.deleteMany({ where: { institutionId: { in: [institutionId, foreignInstitution] } } });
    await db.institution.deleteMany({ where: { id: { in: [institutionId, foreignInstitution] } } });
    await app.close();
  }
});
