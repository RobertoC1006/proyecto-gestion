require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Test } = require('@nestjs/testing');
const { AppModule } = require('../dist/app.module');
const { AcademicIdentity, AcademicDirectory } = require('../dist/academic/academic.access');
const { AcademicService } = require('../dist/academic/academic.service');
const { PrismaService } = require('../dist/database/prisma.service');

test('Calendario manual: integración PostgreSQL y permisos', async t => {
  let app, closedApp;
  const institutionId = randomUUID(), otherInstitution = randomUUID();
  const admin = { id: randomUUID(), institutionId, role: 'administrador', csrfVerified: true };
  const studentA = { id: randomUUID(), institutionId, role: 'estudiante', csrfVerified: true };
  const studentB = { id: randomUUID(), institutionId, role: 'docente', csrfVerified: true };
  const otherAdmin = { ...admin, institutionId: otherInstitution };
  const principals = { admin, studentA, studentB, otherAdmin, unsafe: { ...admin, csrfVerified: false } };
  const builder = Test.createTestingModule({ imports: [AppModule] });
  const module = await builder.overrideProvider(AcademicIdentity).useValue({ resolve: async req => principals[req.headers['x-test-principal']] ?? null })
    .overrideProvider(AcademicDirectory).useValue({ belongsToInstitution: async (id, institution) => institution === institutionId && [studentA.id, studentB.id].includes(id) }).compile();
  app = module.createNestApplication({ logger: false });
  app.setGlobalPrefix('api/v1');
  await app.listen(0, '127.0.0.1');
  const db = app.get(PrismaService), service = app.get(AcademicService);
  const url = await app.getUrl();
  async function request(path, method = 'GET', body, principal = 'admin') {
    const res = await fetch(`${url}/api/v1/academic/${path}`, { method,
      headers: { 'content-type': 'application/json', 'x-test-principal': principal }, body: body == null ? undefined : JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  }
  const reason = 'Programación académica de prueba.';
  const query = 'from=2026-11-02T00:00:00-05:00&to=2026-11-09T00:00:00-05:00';
  let course, sectionA, sectionB, event;
  try {
    await db.institution.createMany({ data: [{ id: institutionId, code: `T-${institutionId}`, name: 'Institución de prueba' }, { id: otherInstitution, code: `T-${otherInstitution}`, name: 'Otra institución de prueba' }] });
    await t.test('El adaptador publicado deniega roles/cookies/cabeceras inventados', async () => {
      const closed = await Test.createTestingModule({ imports: [AppModule] }).compile();
      closedApp = closed.createNestApplication({ logger: false });
      closedApp.setGlobalPrefix('api/v1'); await closedApp.listen(0, '127.0.0.1');
      const res = await fetch(`${await closedApp.getUrl()}/api/v1/academic/courses`, { headers: { 'x-test-principal': 'admin', 'x-role': 'administrador', cookie: 'role=administrador' } });
      assert.equal(res.status, 401);
      assert.equal((await res.json()).code, 'SESSION_REQUIRED');
      await closedApp.close(); closedApp = null;
      assert.equal((await request('courses', 'GET', null, 'studentA')).status, 403);
      assert.equal((await request('courses', 'POST', { code: 'X', name: 'Curso', reason }, 'unsafe')).status, 403);
    });
    await t.test('Cursos, secciones y asociaciones verificadas sin duplicados', async () => {
      const created = await request('courses', 'POST', { code: 'RED', name: 'Redes I', reason });
      assert.equal(created.status, 201); course = created.body;
      assert.equal((await request('courses', 'POST', { code: 'RED', name: 'Redes I', reason })).status, 409);
      assert.equal((await request('sections', 'POST', { courseId: course.id, code: 'X', name: 'Ajena', reason }, 'otherAdmin')).status, 404);
      sectionA = (await request('sections', 'POST', { courseId: course.id, code: 'A', name: 'Sección A', reason })).body;
      sectionB = (await request('sections', 'POST', { courseId: course.id, code: 'B', name: 'Sección B', reason })).body;
      assert.equal((await request('memberships', 'POST', { sectionId: sectionA.id, subjectId: randomUUID(), reason })).status, 404);
      assert.equal((await request('memberships', 'POST', { sectionId: sectionA.id, subjectId: studentA.id, reason })).status, 201);
      await request('memberships', 'POST', { sectionId: sectionA.id, subjectId: studentA.id, reason });
      await request('memberships', 'POST', { sectionId: sectionB.id, subjectId: studentB.id, reason });
      assert.equal(await db.academicMembership.count({ where: { institutionId } }), 2);
    });
    const input = () => ({ title: 'Redes I · Parcial', type: 'examen', scope: 'section', courseId: course.id, sectionId: sectionA.id, startsAt: '2026-11-06T10:30:00-05:00', endsAt: '2026-11-06T12:00:00-05:00', reason });
    await t.test('Validación de campos, periodos imposibles y alcance', async () => {
      for (const [patch, field] of [
        [{ endsAt: '2026-11-06T09:00:00-05:00' }, 'endsAt'],
        [{ startsAt: '2026-02-30T10:30:00-05:00' }, 'startsAt'],
        [{ startsAt: '2026-11-06T24:00:00-05:00' }, 'startsAt'],
        [{ startsAt: '2026-11-06T10:30' }, 'startsAt'],
        [{ scope: 'institution' }, 'scope'], [{ reason: '' }, 'reason'], [{ title: '' }, 'title'],
      ]) {
        const res = await request('events', 'POST', { ...input(), ...patch });
        assert.equal(res.status, 400); assert.ok(res.body.fields[field]);
      }
      assert.equal(await db.academicEvent.count({ where: { institutionId } }), 0);
      assert.equal((await request('events?from=2026-01-01T00:00:00Z&to=2027-01-01T00:00:00Z')).status, 400);
    });
    await t.test('Guardar evento en UTC, con fuente real y registro atómico de cambio', async () => {
      const saved = await request('events', 'POST', { ...input(), institutionId: otherInstitution, source: 'csv' });
      assert.equal(saved.status, 201); event = saved.body;
      assert.equal(event.institutionId, institutionId); assert.equal(event.source, 'manual');
      assert.equal(event.startsAt, '2026-11-06T15:30:00.000Z');
      assert.equal(event.course.name, 'Redes I'); assert.equal(event.section.code, 'A');
      const log = await db.academicChange.findFirst({ where: { entityId: event.id, action: 'create' } });
      assert.equal(log.actorId, admin.id); assert.equal(log.after.title, event.title); assert.equal(log.reason, reason);
      const record = service.record;
      service.record = async () => { throw new Error('Fallo de auditoría inyectado'); };
      try { await assert.rejects(service.saveEvent(admin, { ...input(), title: 'No debe persistir' })); }
      finally { service.record = record; }
      assert.equal(await db.academicEvent.count({ where: { institutionId, title: 'No debe persistir' } }), 0);
    });
    await t.test('Contexto personal limitado por sección, curso e institución', async () => {
      await request('events', 'POST', { ...input(), title: 'Solo sección B', sectionId: sectionB.id });
      await request('events', 'POST', { ...input(), title: 'Para todo el curso', scope: 'course', sectionId: null });
      await request('events', 'POST', { ...input(), title: 'Matrícula institucional', type: 'matricula', scope: 'institution', courseId: null, sectionId: null });
      await request('events', 'POST', { ...input(), title: 'Otra institución', scope: 'institution', courseId: null, sectionId: null }, 'otherAdmin');
      const a = await request(`me/events?${query}&subjectId=${studentB.id}`, 'GET', null, 'studentA');
      const b = await request(`me/events?${query}`, 'GET', null, 'studentB');
      assert.equal(a.status, 200); assert.equal(a.body.total, 3); assert.equal(b.body.total, 3);
      assert.ok(a.body.items.some(e => e.id === event.id));
      assert.ok(!a.body.items.some(e => ['Solo sección B', 'Otra institución'].includes(e.title)));
      assert.ok(!b.body.items.some(e => e.id === event.id));
      assert.equal((await request(`events/${event.id}`, 'GET', null, 'otherAdmin')).status, 404);
      assert.equal((await request(`events?${query}&pageSize=2`)).body.items.length, 2);
      assert.equal((await request(`events?${query}&type=matricula`)).body.total, 1);
      // La frontera superior es exclusiva; no incluir el evento que empieza allí.
      assert.equal((await request('events?from=2026-11-06T08:00:00-05:00&to=2026-11-06T10:30:00-05:00')).body.total, 0);
    });
    await t.test('Dos ediciones simultáneas conservan solo una versión y rechazan cambios perdidos', async () => {
      const results = await Promise.all(['Actualización uno', 'Actualización dos'].map(title => request(`events/${event.id}`, 'PATCH', { ...input(), title, expectedVersion: 1 })));
      assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
      assert.equal(await db.academicChange.count({ where: { entityId: event.id, action: 'update' } }), 1);
      assert.equal((await request(`events/${event.id}`)).body.version, 2);
      assert.equal((await request(`events/${event.id}`, 'DELETE', { expectedVersion: 1, reason })).status, 409);
      assert.equal((await request(`events/${event.id}`, 'DELETE', { expectedVersion: 2, reason })).status, 200);
      assert.equal((await request(`events/${event.id}`)).status, 404);
      assert.equal(await db.academicChange.count({ where: { entityId: event.id } }), 3);
    });
    await t.test('Las restricciones PostgreSQL impiden saltarse fechas y alcance', async () => {
      await assert.rejects(db.$executeRaw`INSERT INTO "AcademicEvent" ("id","institutionId","title","type","scope","source","startsAt","endsAt","updatedAt") VALUES (${randomUUID()}::uuid,${institutionId}::uuid,'Inválido','examen','section','manual',now(),now() - interval '1 hour',now())`);
      await assert.rejects(db.$executeRaw`INSERT INTO "AcademicEvent" ("id","institutionId","title","type","scope","source","startsAt","endsAt","updatedAt") VALUES (${randomUUID()}::uuid,${institutionId}::uuid,'Inválido','examen','section','manual',now(),now() + interval '1 hour',now())`);
      await assert.rejects(db.$executeRaw`INSERT INTO "AcademicEvent" ("id","institutionId","title","type","scope","courseId","source","startsAt","endsAt","updatedAt") VALUES (${randomUUID()}::uuid,${otherInstitution}::uuid,'Inválido','examen','course',${course.id}::uuid,'manual',now(),now() + interval '1 hour',now())`);
      assert.equal(await db.academicEvent.count({ where: { institutionId, title: 'Inválido' } }), 0);
      await request(`memberships/${sectionA.id}/${studentA.id}`, 'DELETE', { reason });
      const res = await request(`me/events?${query}`, 'GET', null, 'studentA');
      assert.deepEqual(res.body.items.map(e => e.title), ['Matrícula institucional']);
    });
  } finally {
    if (closedApp) await closedApp.close();
    for (const model of ['academicChange', 'academicEvent', 'academicMembership', 'academicSection', 'academicCourse']) {
      await db[model].deleteMany({ where: { institutionId: { in: [institutionId, otherInstitution] } } });
    }
    await db.institution.deleteMany({ where: { id: { in: [institutionId, otherInstitution] } } });
    await app.close();
  }
});
