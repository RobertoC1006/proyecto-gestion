require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { Test } = require('@nestjs/testing');
const { UnauthorizedException, ServiceUnavailableException } = require('@nestjs/common');
const { AppModule } = require('../dist/app.module');
const { AuthProvider } = require('../dist/auth/auth.provider');
const { AuthConfig } = require('../dist/auth/auth.config');
const { IdentityDirectory } = require('../dist/auth/auth.directory');
const { requireScope } = require('../dist/auth/auth.policy');
const { PrismaService } = require('../dist/database/prisma.service');
const { digest, decrypt, csrfToken } = require('../dist/auth/auth.crypto');

test('Identidad: sesiones reales de aplicación con PostgreSQL y proveedor sustituido solo en test', async t => {
  const institutionId = randomUUID(), otherInstitution = randomUUID();
  const users = new Map(), access = new Map(), refreshTokens = new Map();
  let refreshCount = 0, unavailable = false, revoked = [], registered;
  function issue(user) {
    const tokens = { access: randomBytes(24).toString('hex'), refresh: randomBytes(24).toString('hex'), expiresAt: Math.floor(Date.now() / 1000) + 3600 };
    access.set(tokens.access, user); refreshTokens.set(tokens.refresh, user); return tokens;
  }
  const provider = {
    async login(email, password) { if (unavailable) throw new ServiceUnavailableException(); const user = users.get(email); if (!user || password !== 'Password-test-123') throw new UnauthorizedException(); return issue(user); },
    async validate(token) { if (unavailable) throw new ServiceUnavailableException(); if (!access.has(token)) throw new UnauthorizedException(); return access.get(token); },
    async refresh(token) { if (unavailable) throw new ServiceUnavailableException(); const user = refreshTokens.get(token); if (!user) throw new UnauthorizedException(); refreshTokens.delete(token); refreshCount++; await new Promise(r => setTimeout(r, 30)); return issue(user); },
    async revoke(token, scope) { if (unavailable) throw new ServiceUnavailableException(); revoked.push({ token, scope }); },
    async register(email, password, displayName) { registered = { email, password, displayName }; return JSON.stringify({ email }); },
    async recover(email) { return JSON.stringify({ email }); },
    async exchange(code, storage) { const { email } = JSON.parse(storage); if (code !== 'valid-code' || !users.has(email)) throw new UnauthorizedException(); return issue(users.get(email)); },
    async changePassword() {},
  };
  async function createApp(config) {
    const builder = Test.createTestingModule({ imports: [AppModule] }).overrideProvider(AuthProvider).useValue(provider);
    if (config) builder.overrideProvider(AuthConfig).useValue(config);
    const module = await builder.compile();
    const app = module.createNestApplication({ logger: false }); app.setGlobalPrefix('api/v1'); await app.listen(0, '127.0.0.1'); return app;
  }
  const app = await createApp(), secondApp = await createApp();
  const differentConfig = new AuthConfig();
  Object.defineProperty(differentConfig, 'key', { value: randomBytes(32) });
  const otherInstallation = await createApp(differentConfig);
  const db = app.get(PrismaService), directory = app.get(IdentityDirectory);
  const base = await app.getUrl(), secondBase = await secondApp.getUrl();
  async function request(path, { method = 'GET', body, session, headers = {}, target = base } = {}) {
    const res = await fetch(`${target}/api/v1/${path}`, { method, redirect: 'manual', headers: { origin: 'http://localhost:8080', 'content-type': 'application/json', ...(session ? { cookie: session.cookie, 'x-csrf-token': session.csrf } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text(); let result; try { result = JSON.parse(text); } catch { result = text; }
    return { status: res.status, body: result, cookie: res.headers.get('set-cookie'), location: res.headers.get('location'), cache: res.headers.get('cache-control') };
  }
  async function login(email, extra = {}) {
    const result = await request('auth/login', { method: 'POST', body: { email, password: 'Password-test-123', ...extra } });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    return { cookie: result.cookie.split(';')[0], csrf: result.body.csrfToken, body: result.body, header: result.cookie };
  }
  const admin = { id: randomUUID(), email: `admin-${randomUUID()}@example.test`, displayName: 'Admin prueba' };
  const student = { id: randomUUID(), email: `student-${randomUUID()}@example.test`, displayName: 'Estudiante prueba' };
  const outsider = { id: randomUUID(), email: `other-${randomUUID()}@example.test`, displayName: 'Otra institución' };
  for (const u of [admin, student, outsider]) users.set(u.email, u);
  let adminSession, studentSession;
  try {
    await db.institution.createMany({ data: [{ id: institutionId, code: 'AUTH-TEST', name: 'Identidad de prueba' }, { id: otherInstitution, code: `O-${otherInstitution}`, name: 'Otra institución' }] });
    await db.appUser.createMany({ data: [{ ...admin, institutionId, role: 'administrador' }, { ...outsider, institutionId: otherInstitution, role: 'administrador' }] });
    await t.test('Sin sesión o con cabeceras/roles inventados no hay acceso', async () => {
      assert.equal((await request('auth/me')).status, 401);
      assert.equal((await request('academic/courses', { headers: { 'x-role': 'administrador', cookie: 'role=administrador; campus_session=inventada' } })).status, 401);
      assert.equal((await request('auth/login', { method: 'POST', body: { email: admin.email, password: 'Password-test-123' }, headers: { origin: 'https://attacker.example' } })).status, 403);
      assert.equal((await request('auth/register', { method: 'POST', body: {} })).status, 400);
    });
    await t.test('Login guarda tokens cifrados y cookie opaca HttpOnly; registro no permite escoger rol', async () => {
      adminSession = await login(admin.email);
      studentSession = await login(student.email, { role: 'administrador', institutionId: otherInstitution, permissions: ['users:manage'] });
      assert.equal(studentSession.body.user.role, 'estudiante');
      assert.equal(studentSession.body.user.institutionId, institutionId);
      assert.ok(!studentSession.body.user.permissions.includes('users:manage'));
      assert.match(adminSession.header, /HttpOnly/); assert.match(adminSession.header, /SameSite=Lax/);
      assert.ok(!JSON.stringify(adminSession.body).includes('refresh'));
      const raw = adminSession.cookie.split('=')[1];
      const stored = await db.authSession.findUnique({ where: { id: digest(raw) } });
      assert.notEqual(stored.id, raw);
      const tokens = decrypt(Buffer.from(process.env.AUTH_ENCRYPTION_KEY, 'base64'), stored.id, stored.tokens);
      assert.ok(!stored.tokens.includes(tokens.access)); assert.ok(!stored.tokens.includes(tokens.refresh));
      assert.equal((await request('auth/me', { session: adminSession })).cache, 'no-store');
      const reg = await request('auth/register', { method: 'POST', body: { email: 'new@example.test', password: 'Password-test-123', displayName: 'Nueva cuenta', role: 'administrador' } });
      assert.equal(reg.status, 200); assert.equal(registered.displayName, 'Nueva cuenta'); assert.equal(registered.role, undefined);
      assert.equal(await db.appUser.count({ where: { email: 'new@example.test' } }), 0);
    });
    await t.test('Permisos efectivos, Origin/CSRF y directorio real para calendario', async () => {
      assert.equal((await request('academic/courses', { session: studentSession })).status, 403);
      assert.equal((await request('academic/courses', { session: adminSession })).status, 200);
      const body = { code: 'AUTH', name: 'Curso prueba', reason: 'Prueba de identidad real de aplicación' };
      assert.equal((await request('academic/courses', { method: 'POST', body, session: adminSession, headers: { 'x-csrf-token': 'falso' } })).status, 403);
      assert.equal((await request('academic/courses', { method: 'POST', body, session: adminSession, headers: { origin: 'https://other.example' } })).status, 403);
      const course = (await request('academic/courses', { method: 'POST', body, session: adminSession })).body;
      const section = (await request('academic/sections', { method: 'POST', body: { code: 'A', name: 'Sección A', courseId: course.id, reason: body.reason }, session: adminSession })).body;
      const member = await request('academic/memberships', { method: 'POST', session: adminSession, body: { sectionId: section.id, subjectId: student.id, reason: body.reason } });
      assert.equal(member.status, 201);
      assert.equal((await request('academic/memberships', { method: 'POST', session: adminSession, body: { sectionId: section.id, subjectId: outsider.id, reason: body.reason } })).status, 404);
      const event = { title: 'Examen sección A', type: 'examen', scope: 'section', courseId: course.id, sectionId: section.id, startsAt: '2026-11-07T15:00:00Z', endsAt: '2026-11-07T16:00:00Z', reason: body.reason };
      assert.equal((await request('academic/events', { method: 'POST', body: event, session: adminSession })).status, 201);
      const own = await request('academic/me/events?from=2026-11-07T00:00:00Z&to=2026-11-08T00:00:00Z', { session: studentSession });
      assert.equal(own.body.total, 1);
      const outside = await login(outsider.email);
      assert.equal((await request('academic/me/events?from=2026-11-07T00:00:00Z&to=2026-11-08T00:00:00Z', { session: outside })).body.total, 0);
      assert.throws(() => requireScope({ ...studentSession.body.user, active: true }, { institutionId: otherInstitution }, 'institution'));
    });
    await t.test('Renovación simultánea desde dos procesos rota una sola vez', async () => {
      const id = digest(studentSession.cookie.split('=')[1]);
      await db.authSession.update({ where: { id }, data: { tokenExpiresAt: new Date(0) } });
      const before = refreshCount;
      const results = await Promise.all(Array.from({ length: 6 }, (_, i) => request('auth/me', { session: studentSession, target: i % 2 ? secondBase : base })));
      assert.ok(results.every(r => r.status === 200)); assert.equal(refreshCount - before, 1);
    });
    await t.test('Caída temporal no elimina sesión; token rotado se conserva si falla validación posterior', async () => {
      unavailable = true;
      assert.equal((await request('auth/me', { session: studentSession })).status, 503);
      unavailable = false;
      assert.equal((await request('auth/me', { session: studentSession })).status, 200);
      const validate = provider.validate;
      const id = digest(studentSession.cookie.split('=')[1]);
      await db.authSession.update({ where: { id }, data: { tokenExpiresAt: new Date(0) } });
      provider.validate = async () => { throw new ServiceUnavailableException(); };
      try { assert.equal((await request('auth/me', { session: studentSession })).status, 503); } finally { provider.validate = validate; }
      const count = refreshCount;
      assert.equal((await request('auth/me', { session: studentSession })).status, 200);
      assert.equal(refreshCount, count);
    });
    await t.test('Cambiar permisos/desactivar invalida acceso previo y guarda cambio atómico', async () => {
      const updated = await directory.changeAccess(admin.id, student.id, { expectedVersion: 1, role: 'docente', active: true, teamId: null, reason: 'Asignación docente autorizada de prueba' });
      assert.equal(updated.role, 'docente');
      assert.equal((await request('auth/me', { session: studentSession })).status, 401);
      await assert.rejects(directory.changeAccess(student.id, admin.id, { expectedVersion: 1, role: 'estudiante', active: true, teamId: null, reason: 'Intento sin permiso' }));
      await assert.rejects(directory.changeAccess(admin.id, admin.id, { expectedVersion: 1, role: 'estudiante', active: true, teamId: null, reason: 'No debe eliminar último administrador' }));
      await assert.rejects(directory.changeAccess(admin.id, student.id, { expectedVersion: 1, role: 'docente', active: true, teamId: null, reason: 'Versión antigua debe rechazarse' }));
      assert.equal(await db.identityChange.count({ where: { subjectId: student.id } }), 1);
      studentSession = await login(student.email);
      await directory.changeAccess(admin.id, student.id, { expectedVersion: 2, role: 'docente', active: false, teamId: null, reason: 'Desactivación de cuenta de prueba' });
      assert.equal((await request('auth/me', { session: studentSession })).status, 401);
      assert.equal((await request('auth/login', { method: 'POST', body: { email: student.email, password: 'Password-test-123' } })).status, 403);
      await directory.changeAccess(admin.id, student.id, { expectedVersion: 3, role: 'estudiante', active: true, teamId: null, reason: 'Restablecer cuenta de prueba' });
    });
    await t.test('Caducidad absoluta, cookie reemplazada y cierre revocan la sesión en servidor', async () => {
      const expired = await login(student.email);
      await db.authSession.update({ where: { id: digest(expired.cookie.split('=')[1]) }, data: { expiresAt: new Date(0) } });
      assert.equal((await request('auth/me', { session: expired })).status, 401);
      const session = await login(student.email);
      assert.equal((await request('auth/logout', { method: 'POST', body: {}, session, headers: { 'x-csrf-token': 'bad' } })).status, 403);
      const out = await request('auth/logout', { method: 'POST', body: {}, session });
      assert.equal(out.status, 200); assert.equal(out.body.providerRevoked, true); assert.match(out.cookie, /Max-Age=0/);
      assert.equal((await request('auth/me', { session })).status, 401);
      assert.ok(revoked.length);
      const offline = await login(student.email); unavailable = true;
      const local = await request('auth/logout', { method: 'POST', body: {}, session: offline });
      assert.equal(local.body.providerRevoked, false); unavailable = false;
      assert.equal((await request('auth/me', { session: offline })).status, 401);
    });
    await t.test('Recuperación PKCE requiere enlace y cookie del mismo navegador; invalida sesiones', async () => {
      const one = await login(student.email), two = await login(student.email);
      const recover = await request('auth/recovery/request', { method: 'POST', body: { email: student.email } });
      assert.equal(recover.status, 200);
      let flow = { cookie: recover.cookie.split(';')[0], csrf: '' };
      const wrongBrowser = await request('auth/callback?code=valid-code');
      assert.equal(wrongBrowser.location, '/login?link=invalid');
      assert.equal((await request('auth/recovery/status', { session: flow })).status, 401);
      const callback = await request('auth/callback?code=valid-code', { session: flow });
      assert.equal(callback.status, 303); assert.equal(callback.location, '/login?recovery=1');
      flow.csrf = (await request('auth/recovery/status', { session: flow })).body.csrfToken;
      assert.equal((await request('auth/recovery/reset', { method: 'POST', body: { password: 'Password-new-123' }, session: flow, headers: { 'x-csrf-token': 'wrong' } })).status, 403);
      assert.equal((await request('auth/recovery/reset', { method: 'POST', body: { password: 'Password-new-123' }, session: flow })).status, 200);
      assert.equal((await request('auth/recovery/status', { session: flow })).status, 401);
      assert.equal((await request('auth/me', { session: one })).status, 401); assert.equal((await request('auth/me', { session: two })).status, 401);
    });
    await t.test('Dos instalaciones comparten usuarios/datos sin descifrar o borrar sesiones/PKCE ajenos', async () => {
      const session = await login(student.email);
      const id = digest(session.cookie.split('=')[1]), target = await otherInstallation.getUrl();
      assert.equal((await request('auth/me', { session, target })).status, 401);
      const foreignCsrf = csrfToken(differentConfig.key, session.cookie.split('=')[1]);
      assert.equal((await request('auth/logout', { method: 'POST', body: {}, session: { ...session, csrf: foreignCsrf }, target })).status, 200);
      assert.ok(await db.authSession.findUnique({ where: { id } }));
      assert.equal((await request('auth/me', { session })).status, 200);
      const own = await request('auth/login', { method: 'POST', target, body: { email: student.email, password: 'Password-test-123' } });
      assert.equal(own.status, 200); assert.equal(own.body.user.id, session.body.user.id);
      const shared = await request('academic/me/events?from=2026-11-07T00:00:00Z&to=2026-11-08T00:00:00Z', {
        target, session: { cookie: own.cookie.split(';')[0], csrf: own.body.csrfToken }
      });
      assert.equal(shared.status, 200); assert.equal(shared.body.total, 1);
      const recover = await request('auth/recovery/request', { method: 'POST', body: { email: student.email } });
      const flow = { cookie: recover.cookie.split(';')[0] };
      const flowId = digest(flow.cookie.split('=')[1]);
      assert.equal((await request('auth/callback?code=valid-code', { session: flow, target })).location, '/login?link=invalid');
      assert.ok(await db.authFlow.findUnique({ where: { id: flowId } }));
      assert.equal((await request('auth/callback?code=valid-code', { session: flow })).location, '/login?recovery=1');
    });
    await t.test('Limitación de intentos persistente entre procesos', async () => {
      const email = `${randomUUID()}@example.test`;
      for (let i = 0; i < 12; i++) assert.equal((await request('auth/login', { method: 'POST', body: { email, password: 'incorrecta' }, target: i % 2 ? secondBase : base })).status, 401);
      assert.equal((await request('auth/login', { method: 'POST', body: { email, password: 'incorrecta' } })).status, 429);
    });
  } finally {
    unavailable = false;
    await db.identityChange.deleteMany({ where: { institutionId } });
    for (const model of ['academicChange', 'academicEvent', 'academicMembership', 'academicSection', 'academicCourse', 'appUser']) await db[model].deleteMany({ where: { institutionId: { in: [institutionId, otherInstitution] } } });
    await db.institution.deleteMany({ where: { id: { in: [institutionId, otherInstitution] } } });
    await db.authThrottle.deleteMany(); await db.authFlow.deleteMany();
    await otherInstallation.close(); await secondApp.close(); await app.close();
  }
});
