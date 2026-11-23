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
    const text = await response.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    return { status: response.status, body: parsed, cookie: response.headers.get('set-cookie'),
      contentType: response.headers.get('content-type'), disposition: response.headers.get('content-disposition'), cache: response.headers.get('cache-control') };
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
      const mismatch = await request('consent/accept', { method: 'POST', body: { expectedVersionId: randomUUID() }, session: studentSession });
      assert.equal(mismatch.status, 409);
      const accepted = await request('consent/accept', { method: 'POST', body: { expectedVersionId: version.id }, session: studentSession });
      assert.equal([200, 201].includes(accepted.status), true); assert.equal(accepted.body.version, version.version);
      const duplicate = await request('consent/accept', { method: 'POST', body: { expectedVersionId: version.id }, session: studentSession });
      assert.equal([200, 201].includes(duplicate.status), true); assert.equal(duplicate.body.id, accepted.body.id);
      assert.equal(await db.consentAcceptance.count({ where: { userId: student.id } }), 1);
    });
    await t.test('La consulta administrativa lista aceptaciones sin correo', async () => {
      assert.equal((await request('consent/acceptances', { session: studentSession })).status, 403);
      const result = await request('consent/acceptances?page=1&pageSize=20', { session: adminSession });
      assert.equal(result.status, 200);
      assert.equal(result.body.total, 1);
      assert.equal(result.body.items[0].displayName, student.displayName);
      assert.equal(result.body.items[0].email, undefined);
    });
    await t.test('Auditoría exige permiso y filtra por institución, acción y página', async () => {
      assert.equal((await request('audit', { session: studentSession })).status, 403);
      const first = await request('audit?action=consent.accept&page=1&pageSize=1', { session: adminSession });
      assert.equal(first.status, 200); assert.equal(first.body.total, 1); assert.equal(first.body.items.length, 1);
      assert.equal(first.body.items[0].actor, student.displayName);
      assert.equal(first.body.items[0].after.email, undefined);
      assert.equal((await request('audit?actorId=' + foreign.id, { session: adminSession })).body.total, 0);
    });
    await t.test('Auditoría elimina claves sensibles anidadas y motivos privados', async () => {
      await db.rolePermissionChange.create({ data: {
        institutionId, actorId: admin.id, role: 'estudiante',
        reason: 'password=secreto; content=información privada',
        before: { password: 'secreto', nested: { token: 'token-privado', safe: 'visible' }, values: ['privado'] },
        after: { email: 'persona@example.test', authorization: 'Bearer secreto', nested: { safe: 'también visible' } },
      } });
      const result = await request('audit?action=permissions.change&objectType=RoleAccess', { session: adminSession });
      assert.equal(result.status, 200);
      assert.equal(result.body.total, 1);
      const item = result.body.items[0];
      assert.equal(item.reason, null);
      assert.equal(item.before.password, undefined);
      assert.equal(item.before.nested.token, undefined);
      assert.equal(item.before.nested.safe, 'visible');
      assert.deepEqual(item.before.values, ['privado']);
      assert.equal(item.after.email, undefined);
      assert.equal(item.after.authorization, undefined);
      assert.equal(item.after.nested.safe, 'también visible');
    });
    await t.test('Auditoría encuentra coincidencias antiguas detrás de otros objetos', async () => {
      const objectId = randomUUID();
      const data = Array.from({ length: 8 }, (_, i) => ({ institutionId, actorId: admin.id,
        entityType: 'AuditProbe', entityId: i === 0 ? objectId : randomUUID(), action: 'create',
        reason: 'Prueba', createdAt: new Date(Date.UTC(2020, 0, 1, 0, i)) }));
      await db.academicChange.createMany({ data });
      const result = await request(`audit?objectId=${objectId}&pageSize=1`, { session: adminSession });
      assert.equal(result.status, 200); assert.equal(result.body.total, 1);
      assert.equal(result.body.items[0].objectId, objectId);
    });
    await t.test('Auditoría cuenta y ordena todo el historial entre páginas', async () => {
      const stamp = new Date('2021-01-01T00:00:00Z');
      const ids = Array.from({ length: 12 }, () => randomUUID()).sort().reverse();
      await db.academicChange.createMany({ data: ids.slice(0, 6).map(id => ({ id, institutionId, actorId: admin.id,
        entityType: 'AuditPages', entityId: randomUUID(), action: 'create', reason: 'Prueba', createdAt: stamp })) });
      await db.identityChange.createMany({ data: ids.slice(6).map(id => ({ id, institutionId, actorId: admin.id,
        subjectId: student.id, reason: 'Prueba', before: {}, after: {}, createdAt: stamp })) });
      const seen = [];
      for (let page = 1; page <= 7; page++) {
        const result = await request(`audit?from=2021-01-01T00:00:00Z&to=2021-01-02T00:00:00Z&pageSize=2&page=${page}`, { session: adminSession });
        assert.equal(result.status, 200); assert.equal(result.body.total, 12);
        seen.push(...result.body.items.map(item => item.id));
        if (page === 7) assert.deepEqual(result.body.items, []);
      }
      assert.deepEqual(seen, ids);
    });
    await t.test('CSV acepta from, to y ambos sin validar dos veces', async () => {
      for (const dates of ['from=2021-01-01T00:00:00Z', 'to=2021-01-02T00:00:00Z', 'from=2021-01-01T00:00:00Z&to=2021-01-02T00:00:00Z']) {
        const result = await request(`audit/export?${dates}`, { session: adminSession });
        assert.equal(result.status, 200, JSON.stringify(result.body));
        assert.ok(result.body.startsWith('id,occurredAt,actorId,actor,action,objectType,objectId,reason'));
        const listed = await request(`audit?${dates}&pageSize=100`, { session: adminSession });
        assert.deepEqual(result.body.split('\r\n').slice(1).map(line => line.split(',')[0]), listed.body.items.map(item => `"${item.id}"`));
      }
    });
    await t.test('CSV exporta más de 100 coincidencias con filtros, orden y escape', async () => {
      const ids = Array.from({ length: 205 }, () => randomUUID()).sort().reverse();
      await db.academicChange.createMany({ data: ids.map(id => ({ id, institutionId, actorId: admin.id,
        entityType: 'AuditExport', entityId: student.id, action: 'create', reason: 'Motivo, "seguro"\nsegunda línea',
        createdAt: new Date('2022-01-01T00:00:00Z') })) });
      await db.academicChange.create({ data: { institutionId: foreignInstitution, actorId: foreign.id,
        entityType: 'AuditExport', entityId: student.id, action: 'create', reason: 'Ajeno' } });
      const path = `audit/export?objectType=AuditExport&objectId=${student.id}&actorId=${admin.id}&action=create`;
      const result = await request(path, { session: adminSession });
      assert.equal(result.status, 200);
      assert.equal(result.contentType, 'text/csv; charset=utf-8');
      assert.equal(result.disposition, 'attachment; filename="campusitsm-auditoria.csv"');
      assert.equal(result.cache, 'no-store');
      const lines = result.body.split('\r\n');
      assert.equal(lines.length, 206);
      assert.deepEqual(lines.slice(1).map(line => line.split(',')[0]), ids.map(id => `"${id}"`));
      assert.ok(lines[1].endsWith('"Motivo, ""seguro"" segunda línea"'));
      assert.equal((await request(`audit/export?actorId=${foreign.id}`, { session: adminSession })).body.split('\r\n').length, 1);
    });
    await t.test('Las cinco fuentes se intercalan sin exponer otra institución', async () => {
      const expected = [];
      const probeVersion = await db.consentVersion.create({ data: { version: 'audit-probe', title: 'Prueba', summary: 'Prueba', effectiveAt: new Date('2023-01-01Z') } });
      for (const [tenant, user] of [[institutionId, admin], [foreignInstitution, foreign]]) {
        const stamp = i => new Date(Date.UTC(2023, 0, 1, 0, i));
        const a = await db.academicChange.create({ data: { institutionId: tenant, actorId: user.id, entityType: 'AcademicEvent', entityId: randomUUID(), action: 'create', reason: 'Prueba', createdAt: stamp(1) } });
        const b = await db.identityChange.create({ data: { institutionId: tenant, actorId: user.id, subjectId: user.id, reason: 'Prueba', before: {}, after: {}, createdAt: stamp(2) } });
        const c = await db.rolePermissionChange.create({ data: { institutionId: tenant, actorId: user.id, role: 'estudiante', reason: 'Prueba', before: {}, after: {}, createdAt: stamp(3) } });
        const d = await db.consentAcceptance.create({ data: { institutionId: tenant, userId: user.id, consentVersionId: probeVersion.id, acceptedAt: stamp(4) } });
        const ticket = await db.ticket.create({ data: { institutionId: tenant, ownerId: user.id, code: `INC-${randomUUID()}`, description: 'Prueba aislada de auditoría.', service: 'equipos', scope: 'general', idempotencyKey: randomUUID(), requestHash: '2'.repeat(64) } });
        const e = await db.ticketChange.create({ data: { institutionId: tenant, actorId: user.id, ticketId: ticket.id, action: 'classify', note: 'Prueba', createdAt: stamp(5) } });
        if (tenant === institutionId) expected.push(e.id, d.id, c.id, b.id, a.id);
      }
      const query = 'from=2023-01-01T00:00:00Z&to=2023-01-02T00:00:00Z';
      const seen = [];
      for (let page = 1; page <= 4; page++) {
        const result = await request(`audit?${query}&pageSize=2&page=${page}`, { session: adminSession });
        assert.equal(result.status, 200); assert.equal(result.body.total, 5);
        seen.push(...result.body.items.map(item => item.id));
        assert.ok(result.body.items.every(item => item.actorId === admin.id && item.actor === admin.displayName));
      }
      assert.deepEqual(seen, expected);
      const exported = await request(`audit/export?${query}`, { session: adminSession });
      assert.equal(exported.status, 200);
      assert.deepEqual(exported.body.split('\r\n').slice(1).map(line => line.split(',')[0]), expected.map(id => `"${id}"`));
    });
    await t.test('Consultas rechazadas no mutan la auditoría', async () => {
      const before = (await request('audit?pageSize=100', { session: adminSession })).body;
      for (const route of ['audit', 'audit/export']) {
        assert.equal((await request(route)).status, 401);
        assert.equal((await request(route, { session: studentSession })).status, 403);
        for (const query of ['from=invalid', 'to=invalid', 'unexpected=1', 'from=2022-01-02T00:00:00Z&to=2022-01-01T00:00:00Z']) {
          const result = await request(`${route}?${query}`, { session: adminSession });
          assert.equal(result.status, 400); assert.equal(result.body.code, 'VALIDATION_ERROR');
        }
      }
      assert.deepEqual((await request('audit?pageSize=100', { session: adminSession })).body, before);
    });
    await t.test('Auditoría integra cambios de tickets y exporta CSV autorizado', async () => {
      const ticket = await db.ticket.create({
        data: {
          institutionId,
          ownerId: student.id,
          code: `INC-PRIVACY-${randomUUID().slice(0, 8)}`,
          description: 'Prueba privada de auditoría.',
          service: 'equipos',
          scope: 'general',
          idempotencyKey: randomUUID(),
          requestHash: '1'.repeat(64),
          status: 'resuelto',
          failureConfirmed: true,
          resolvedAt: new Date(),
        },
      });
      await db.ticketChange.create({
        data: {
          ticketId: ticket.id,
          institutionId,
          actorId: admin.id,
          action: 'resolve',
          note: 'Falla confirmada',
          before: { status: 'en_atencion' },
          after: { status: 'resuelto', solution: 'Se reparó el equipo.' },
        },
      });
      const result = await request('audit?action=ticket.resolve&objectType=Ticket', { session: adminSession });
      assert.equal(result.status, 200);
      assert.equal(result.body.items.length, 1);
      assert.equal(result.body.items[0].objectId, ticket.id);
      assert.equal(result.body.items[0].after.status, 'resuelto');
      const exported = await request('audit/export?action=ticket.resolve&objectType=Ticket', { session: adminSession });
      assert.equal(exported.status, 200, JSON.stringify(exported.body));
      assert.equal((await request('audit/export?action=ticket.resolve&objectType=Ticket', { session: studentSession })).status, 403);
    });
  } finally {
    await db.academicChange.deleteMany({ where: { institutionId: { in: [institutionId, foreignInstitution] } } });
    await db.identityChange.deleteMany({ where: { institutionId: { in: [institutionId, foreignInstitution] } } });
    await db.ticketChange.deleteMany({ where: { institutionId: { in: [institutionId, foreignInstitution] } } });
    await db.ticket.deleteMany({ where: { institutionId: { in: [institutionId, foreignInstitution] } } });
    await db.rolePermissionChange.deleteMany({ where: { institutionId: { in: [institutionId, foreignInstitution] } } });
    await db.consentAcceptance.deleteMany({ where: { institutionId: { in: [institutionId, foreignInstitution] } } });
    await db.consentVersion.deleteMany({ where: { version: { in: ['1.0', 'audit-probe'] } } });
    await db.appUser.deleteMany({ where: { institutionId: { in: [institutionId, foreignInstitution] } } });
    await db.institution.deleteMany({ where: { id: { in: [institutionId, foreignInstitution] } } });
    await app.close();
  }
});
