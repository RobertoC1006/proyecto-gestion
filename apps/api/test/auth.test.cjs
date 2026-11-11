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
  const teacher = { id: randomUUID(), email: `teacher-${randomUUID()}@example.test`, displayName: 'Docente prueba' };
  const outsider = { id: randomUUID(), email: `other-${randomUUID()}@example.test`, displayName: 'Otra institución' };
  for (const u of [admin, student, teacher, outsider]) users.set(u.email, u);
  let adminSession, studentSession;
  try {
    await db.institution.createMany({ data: [{ id: institutionId, code: 'AUTH-TEST', name: 'Identidad de prueba' }, { id: otherInstitution, code: `O-${otherInstitution}`, name: 'Otra institución' }] });
    await db.appUser.createMany({ data: [{ ...admin, institutionId, role: 'administrador' }, { ...teacher, institutionId, role: 'docente' }, { ...outsider, institutionId: otherInstitution, role: 'administrador' }] });
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
    await t.test('Catálogos personales: sesión real, asociaciones y aislamiento PostgreSQL', async t => {
      const course = await db.academicCourse.findUniqueOrThrow({ where: { institutionId_code: { institutionId, code: 'AUTH' } } });
      const original = await db.academicSection.findUniqueOrThrow({ where: { courseId_code: { courseId: course.id, code: 'A' } } });
      const ownSection = await db.academicSection.create({ data: { institutionId, courseId: course.id, code: 'B', name: 'Otro grupo propio' } });
      const teacherSection = await db.academicSection.create({ data: { institutionId, courseId: course.id, code: 'C', name: 'Grupo del docente' } });
      async function catalog(targetInstitution, code, name, subjectId) {
        const row = await db.academicCourse.create({ data: { institutionId: targetInstitution, code, name } });
        const section = await db.academicSection.create({ data: { institutionId: targetInstitution, courseId: row.id, code: 'A', name: 'Grupo A' } });
        await db.academicMembership.create({ data: { institutionId: targetInstitution, courseId: row.id, sectionId: section.id, subjectId } });
        return { course: row, section };
      }
      const mine = await catalog(institutionId, 'OWN', 'A · Segundo curso propio', student.id);
      const theirs = await catalog(institutionId, 'OTHER', 'Z · Curso de otro usuario', teacher.id);
      const foreign = await catalog(otherInstitution, 'FOREIGN', 'Curso de otra institución', outsider.id);
      await db.academicMembership.createMany({ data: [
        { institutionId, courseId: course.id, sectionId: ownSection.id, subjectId: student.id },
        { institutionId, courseId: course.id, sectionId: teacherSection.id, subjectId: teacher.id },
      ] });
      const teacherSession = await login(teacher.email), outsiderSession = await login(outsider.email);
      const courses = 'academic/me/courses';
      const sections = `academic/me/sections?courseId=${course.id}`;
      await t.test('Ambas rutas requieren sesión y rechazan identidad inventada', async () => {
        for (const path of [courses, sections]) {
          assert.equal((await request(path)).status, 401);
          assert.equal((await request(path, { headers: { 'x-role': 'administrador', 'x-user-id': student.id, cookie: 'campus_session=inventada' } })).status, 401);
        }
      });
      await t.test('Cursos propios sin duplicados, con paginación y sin datos personales', async () => {
        const result = await request(courses, { session: studentSession });
        assert.equal(result.status, 200); assert.equal(result.cache, 'no-store');
        assert.equal(result.body.total, 2); assert.equal(result.body.page, 1); assert.equal(result.body.pageSize, 100);
        assert.deepEqual(result.body.items.map(item => item.id), [mine.course.id, course.id]);
        assert.deepEqual(Object.keys(result.body.items[0]).sort(), ['code', 'createdAt', 'id', 'institutionId', 'name']);
        const one = await request(`${courses}?pageSize=1`, { session: studentSession });
        const two = await request(`${courses}?page=2&pageSize=1`, { session: studentSession });
        assert.equal(one.body.total, 2); assert.equal(one.body.items.length, 1);
        assert.equal(two.body.items.length, 1); assert.equal(two.body.items[0].id, course.id);
        assert.equal((await request(`${courses}?page=3&pageSize=1`, { session: studentSession })).body.items.length, 0);
      });
      await t.test('Secciones propias del curso, sin revelar grupos ajenos', async () => {
        const result = await request(sections, { session: studentSession });
        assert.equal(result.status, 200); assert.equal(result.cache, 'no-store');
        assert.equal(result.body.total, 2);
        assert.deepEqual(result.body.items.map(item => item.id), [original.id, ownSection.id]);
        assert.deepEqual(Object.keys(result.body.items[0]).sort(), ['code', 'courseId', 'createdAt', 'id', 'institutionId', 'name']);
        const second = await request(`${sections}&page=2&pageSize=1`, { session: studentSession });
        assert.equal(second.body.total, 2); assert.equal(second.body.items[0].id, ownSection.id);
        const teacherResult = await request(sections, { session: teacherSession });
        assert.deepEqual(teacherResult.body.items.map(item => item.id), [teacherSection.id]);
        assert.equal((await request(courses, { session: teacherSession })).body.total, 2);
      });
      await t.test('Usuarios sin asociación, cursos ajenos e institución ajena no amplían alcance', async () => {
        const empty = await request(courses, { session: adminSession });
        assert.deepEqual(empty.body, { items: [], total: 0, page: 1, pageSize: 100 });
        assert.equal((await request(sections, { session: adminSession })).body.total, 0);
        for (const courseId of [theirs.course.id, foreign.course.id, randomUUID()]) {
          const result = await request(`academic/me/sections?courseId=${courseId}`, { session: studentSession });
          assert.equal(result.status, 200); assert.equal(result.body.total, 0); assert.deepEqual(result.body.items, []);
        }
        const foreignCourses = await request(courses, { session: outsiderSession });
        assert.deepEqual(foreignCourses.body.items.map(item => item.id), [foreign.course.id]);
        assert.equal((await request(sections, { session: outsiderSession })).body.total, 0);
      });
      await t.test('Se rechazan curso ausente, UUID/paginación inválidos y selección de otra identidad', async () => {
        for (const [path, field] of [
          ['academic/me/sections', 'courseId'], ['academic/me/sections?courseId=', 'courseId'],
          ['academic/me/sections?courseId=incorrecto', 'courseId'],
          [`${sections}&courseId=${mine.course.id}`, 'courseId'],
          [`${courses}?subjectId=${teacher.id}`, 'subjectId'],
          [`${sections}&institutionId=${otherInstitution}`, 'institutionId'],
          [`${courses}?page=1.5`, 'page'], [`${courses}?page=Infinity`, 'page'],
          [`${courses}?page=0`, 'page'], [`${sections}&pageSize=101`, 'pageSize'],
          [`${sections}&pageSize=2.5`, 'pageSize'],
        ]) {
          const result = await request(path, { session: studentSession });
          assert.equal(result.status, 400, path); assert.ok(result.body.fields[field], path);
        }
      });
      await t.test('Retirar asociaciones actualiza inmediatamente los catálogos personales', async () => {
        await db.academicMembership.deleteMany({ where: { subjectId: student.id, sectionId: { in: [ownSection.id, mine.section.id] } } });
        assert.deepEqual((await request(courses, { session: studentSession })).body.items.map(item => item.id), [course.id]);
        assert.deepEqual((await request(sections, { session: studentSession })).body.items.map(item => item.id), [original.id]);
        assert.equal((await request(`academic/me/sections?courseId=${mine.course.id}`, { session: studentSession })).body.total, 0);
      });
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
      assert.equal((await request('academic/me/courses', { session: studentSession })).status, 401);
      assert.equal((await request(`academic/me/sections?courseId=${randomUUID()}`, { session: studentSession })).status, 401);
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
