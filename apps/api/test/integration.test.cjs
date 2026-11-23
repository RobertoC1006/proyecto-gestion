require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { mkdtemp, rm } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { Test } = require('@nestjs/testing');
const { AppModule } = require('../dist/app.module');
const { AuthService } = require('../dist/auth/auth.service');
const { AcademicIdentity } = require('../dist/academic/academic.access');
const { PrismaService } = require('../dist/database/prisma.service');
const { rolePermissions } = require('../dist/auth/auth.policy');

// Same isolated AuthService fixture seam as workflow.test.cjs; no real Supabase login.
test('Integrated HTTP: owned ticket, resolution, certificate, audit and reporting agree', async () => {
  assert.match(process.env.DATABASE_URL ?? '', /@db:5432\/workflow_test(?:\?|$)/);
  const institutionId = randomUUID(), foreignId = randomUUID();
  const actor = (role, tenant = institutionId) => ({ id: randomUUID(), institutionId: tenant,
    email: `${randomUUID()}@example.test`, displayName: `Integration ${role}`, role,
    active: true, teamId: null, accessVersion: 1, csrfVerified: true, permissions: rolePermissions[role] });
  const users = { student: actor('estudiante'), admin: actor('administrador'), foreign: actor('administrador', foreignId), foreignStudent: actor('estudiante', foreignId) };
  const files = await mkdtemp(join(tmpdir(), 'campusitsm-integration-'));
  const previousFiles = process.env.FILES_DIR;
  process.env.FILES_DIR = files;
  let app;
  try {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AuthService).useValue({ resolve: async request => users[request.headers['x-test-session']] ?? null })
      .overrideProvider(AcademicIdentity).useValue({ resolve: async request => users[request.headers['x-test-session']] ?? null }).compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api/v1');
    await app.listen(0, '127.0.0.1');
    const db = app.get(PrismaService), base = await app.getUrl();
    const call = async (path, session = 'student', method = 'GET', body, headers = {}) => {
      const response = await fetch(`${base}/api/v1/${path}`, { method,
        headers: { 'content-type': 'application/json', 'x-test-session': session, ...headers },
        body: body === undefined ? undefined : JSON.stringify(body) });
      const bytes = Buffer.from(await response.arrayBuffer());
      let parsed = bytes.toString('utf8');
      if (response.headers.get('content-type')?.includes('application/json')) parsed = JSON.parse(parsed);
      return { status: response.status, body: parsed, bytes, contentType: response.headers.get('content-type') };
    };
    await db.institution.createMany({ data: [institutionId, foreignId].map(id => ({ id, code: id, name: 'Isolated integration fixture' })) });
    for (const user of Object.values(users)) {
      const { id, institutionId, email, displayName, role } = user;
      await db.appUser.create({ data: { id, institutionId, email, displayName, role } });
    }
    await db.consentVersion.create({ data: { version: randomUUID(), title: 'Isolated consent', summary: 'Integration fixture only', effectiveAt: new Date(Date.now() - 1000) } });
    const consent = await call('consent/me');
    assert.equal(consent.status, 200);
    assert.ok(consent.body.current);
    const accepted = await call('consent/accept', 'student', 'POST', { expectedVersionId: consent.body.current.id });
    assert.equal(accepted.status, 201, JSON.stringify(accepted.body));
    assert.equal((await call('consent/me')).body.acceptance.id, accepted.body.id);

    const created = await call('tickets', 'student', 'POST', { description: 'Isolated integration: institutional email cannot be opened.',
      service: 'correo', scope: 'general', courseId: null, sectionId: null }, { 'Idempotency-Key': randomUUID() });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const id = created.body.id;
    let current = created.body;
    for (const action of [
      { action: 'evaluate', urgency: 2, impact: 2 },
      { action: 'assign', assigneeId: users.admin.id },
      { action: 'start' },
      { action: 'resolve', solution: 'Restored institutional email and verified access.', failureConfirmed: true },
    ]) {
      const result = await call(`operations/tickets/${id}`, 'admin', 'PATCH', { ...action, expectedVersion: current.version, note: 'Isolated integration verification.' });
      assert.equal(result.status, 200, JSON.stringify(result.body));
      current = result.body;
    }
    const detail = await call(`tickets/${id}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.status, 'resuelto');
    assert.equal(detail.body.failureConfirmed, true);
    assert.equal(detail.body.assigneeName, users.admin.displayName);
    assert.deepEqual((await call('tickets/summary')).body, { total: 1, registered: 0, inAttention: 0, resolved: 1 });
    const issued = await call(`certificates/${id}/issue`, 'student', 'POST');
    assert.equal(issued.status, 200, JSON.stringify(issued.body));
    assert.equal(issued.body.ticketId, id);
    const download = await call(`certificates/${issued.body.id}/download`);
    assert.equal(download.status, 200);
    assert.equal(download.contentType, 'application/pdf');
    assert.equal(download.bytes.subarray(0, 4).toString(), '%PDF');
    const lookup = await call(`certificates/public/${issued.body.code}`, 'anonymous');
    assert.equal(lookup.status, 200);
    assert.equal(lookup.body.code, issued.body.code);
    for (const privateField of ['email', 'ownerId', 'ticketId', 'sha256']) assert.equal(Object.hasOwn(lookup.body, privateField), false);
    const verified = await call(`certificates/public/${issued.body.code}/verify`, 'anonymous', 'POST', { pdfBase64: download.bytes.toString('base64') });
    assert.equal(verified.status, 200);
    assert.deepEqual(verified.body, { code: issued.body.code, status: 'valida', sha256Matches: true });
    const auditPath = `audit?objectId=${id}&objectType=Ticket&action=ticket.resolve`;
    const audit = await call(auditPath, 'admin');
    assert.equal(audit.status, 200);
    assert.equal(audit.body.total, 1);
    assert.equal(audit.body.items[0].objectId, id);
    assert.equal(audit.body.items[0].after.status, 'resuelto');
    const csv = await call(auditPath.replace('audit?', 'audit/export?'), 'admin');
    assert.equal(csv.status, 200);
    assert.match(csv.body, new RegExp(audit.body.items[0].id));
    const dates = `from=${new Date(Date.now() - 86400000).toISOString()}&to=${new Date(Date.now() + 86400000).toISOString()}`;
    const reportPath = `reports?${dates}&scope=institution&service=correo&status=resuelto`;
    const report = await call(reportPath, 'admin');
    assert.equal(report.status, 200);
    assert.equal(report.body.total, 1);
    assert.equal(report.body.resolved, 1);
    assert.equal(report.body.synthetic, false);
    assert.deepEqual(report.body.categories.map(item => [item.service, item.count]), [['correo', 1]]);
    assert.equal((await call(reportPath.replace('reports?', 'reports/export?'), 'admin')).status, 200);

    for (const path of [`tickets/${id}`, `certificates/${issued.body.id}`, `certificates/${issued.body.id}/download`]) {
      assert.equal((await call(path, 'foreignStudent')).status, 404, path);
    }
    assert.equal((await call(`operations/tickets/${id}`, 'foreign')).status, 404);
    assert.equal((await call(`certificates/${id}/issue`, 'foreignStudent', 'POST')).status, 404);
    assert.equal((await call(`operations/tickets/${id}`, 'foreign', 'PATCH', { action: 'start', expectedVersion: current.version, note: 'Foreign request must not change anything.' })).status, 404);
    assert.equal((await call(auditPath, 'foreign')).body.total, 0);
    assert.equal((await call(reportPath, 'foreign')).body.total, 0);
    assert.equal((await call('audit', 'student')).status, 403);
    assert.equal((await call(reportPath, 'student')).status, 403);
    assert.deepEqual((await call(`tickets/${id}`)).body, detail.body);
    assert.deepEqual((await call(`certificates/${issued.body.id}`)).body, issued.body);
    assert.deepEqual((await call(auditPath, 'admin')).body, audit.body);
    assert.deepEqual((await call(reportPath, 'admin')).body, report.body);
    assert.deepEqual((await call('tickets/summary')).body, { total: 1, registered: 0, inAttention: 0, resolved: 1 });
    assert.deepEqual((await call(`certificates/${issued.body.id}/download`)).bytes, download.bytes);
  } finally {
    if (app) await app.close();
    if (previousFiles === undefined) delete process.env.FILES_DIR;
    else process.env.FILES_DIR = previousFiles;
    await rm(files, { recursive: true, force: true });
  }
});
