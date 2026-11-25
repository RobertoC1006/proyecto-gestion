require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { mkdir, rm, writeFile } = require('node:fs/promises');
const { Test } = require('@nestjs/testing');
const { UnauthorizedException } = require('@nestjs/common');
const { AppModule } = require('../dist/app.module');
const { AuthProvider } = require('../dist/auth/auth.provider');
const { AuthConfig } = require('../dist/auth/auth.config');
const { PrismaService } = require('../dist/database/prisma.service');

test('Constancias: HTTP con persistencia real aislada', async t => {
  assert.equal(new URL(process.env.DATABASE_URL).hostname, 'db');
  const institutionId = randomUUID();
  const ownerId = randomUUID();
  const foreignId = randomUUID();
  const adminId = randomUUID();
  const filesDir = join(tmpdir(), `campusitsm-cert-http-${randomUUID()}`);
  const priorFilesDir = process.env.FILES_DIR;
  process.env.FILES_DIR = filesDir;
  const identities = new Map();
  const tokens = new Map();

  const config = new AuthConfig();
  Object.defineProperty(config, 'institutionCode', { value: 'CERTIFICATE-TEST' });
  const provider = {
    async login(email) {
      const user = identities.get(email);
      if (!user) throw new UnauthorizedException();
      const access = randomBytes(24).toString('hex');
      tokens.set(access, user);
      return { access, refresh: 'isolated-test', expiresAt: Math.floor(Date.now() / 1000) + 3600 };
    },
    async validate(token) {
      const user = tokens.get(token);
      if (!user) throw new UnauthorizedException();
      return user;
    },
    async revoke() {},
  };

  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AuthProvider).useValue(provider)
    .overrideProvider(AuthConfig).useValue(config)
    .compile();
  const app = module.createNestApplication({ logger: false });
  app.setGlobalPrefix('api/v1');
  await app.listen(0, '127.0.0.1');
  const db = app.get(PrismaService);
  const base = await app.getUrl();

  const owner = { id: ownerId, email: 'certificate-owner@example.test', displayName: 'Yasmin Zeta', role: 'estudiante' };
  const foreign = { id: foreignId, email: 'certificate-other@example.test', displayName: 'Otro Usuario', role: 'estudiante' };
  const admin = { id: adminId, email: 'certificate-admin@example.test', displayName: 'Admin Campus', role: 'administrador' };
  identities.set(owner.email, owner);
  identities.set(foreign.email, foreign);
  identities.set(admin.email, admin);

  async function request(path, { method = 'GET', body, form, session, raw = false } = {}) {
    const headers = {
      origin: 'http://localhost:8080',
      ...(form ? {} : { 'content-type': 'application/json' }),
      ...(session ? { cookie: session.cookie, 'x-csrf-token': session.csrf } : {}),
    };
    const response = await fetch(`${base}/api/v1/${path}`, {
      method,
      headers,
      body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    if (raw) return { status: response.status, bytes: Buffer.from(await response.arrayBuffer()), headers: response.headers };
    return { status: response.status, body: await response.json().catch(() => ({})), cookie: response.headers.get('set-cookie') };
  }

  async function login(user) {
    const result = await request('auth/login', { method: 'POST', body: { email: user.email, password: 'Password-test-123' } });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    return { cookie: result.cookie.split(';')[0], csrf: result.body.csrfToken };
  }

  let ownerSession;
  let ticketId;
  let certificate;
  try {
    await db.institution.create({ data: { id: institutionId, code: 'CERTIFICATE-TEST', name: 'Prueba aislada constancias' } });
    await db.appUser.createMany({
      data: [
        { id: ownerId, institutionId, email: owner.email, displayName: owner.displayName, role: 'estudiante' },
        { id: foreignId, institutionId, email: foreign.email, displayName: foreign.displayName, role: 'estudiante' },
        { id: adminId, institutionId, email: admin.email, displayName: admin.displayName, role: 'administrador' },
      ],
    });
    const ticket = await db.ticket.create({
      data: {
        institutionId,
        ownerId,
        code: 'INC-2026-CERT-TEST',
        description: 'Prueba aislada de emisión de constancia.',
        service: 'equipos',
        scope: 'general',
        idempotencyKey: randomUUID(),
        requestHash: '0'.repeat(64),
        status: 'resuelto',
        failureConfirmed: true,
        resolvedAt: new Date(),
      },
    });
    ticketId = ticket.id;
    ownerSession = await login(owner);

    await t.test('Emite una sola constancia ante solicitudes repetidas', async () => {
      const first = await request(`certificates/${ticketId}/issue`, { method: 'POST', body: {}, session: ownerSession });
      assert.equal(first.status, 200, JSON.stringify(first.body));
      const second = await request(`certificates/${ticketId}/issue`, { method: 'POST', body: {}, session: ownerSession });
      assert.equal(second.status, 200);
      assert.equal(first.body.id, second.body.id);
      assert.equal(first.body.sha256.length, 64);
      assert.equal(await db.certificate.count({ where: { ticketId } }), 1);
      assert.equal(await db.certificateVerification.count({ where: { institutionId, result: 'emitida' } }), 1);
      certificate = first.body;
    });

    await t.test('El dueño puede consultar y descargar el PDF', async () => {
      const detail = await request(`certificates/${certificate.id}`, { session: ownerSession });
      assert.equal(detail.status, 200);
      assert.equal(detail.body.code, certificate.code);
      const download = await request(`certificates/${certificate.id}/download`, { session: ownerSession, raw: true });
      assert.equal(download.status, 200);
      assert.equal(download.bytes.subarray(0, 4).toString('ascii'), '%PDF');
      assert.equal(download.headers.get('content-type'), 'application/pdf');
      assert.equal(await db.certificateVerification.count({ where: { institutionId, result: 'descargada' } }), 1);
    });

    await t.test('Otro usuario no puede descargar ni ver la constancia', async () => {
      const foreignSession = await login(foreign);
      const detail = await request(`certificates/${certificate.id}`, { session: foreignSession });
      assert.equal(detail.status, 404);
      const download = await request(`certificates/${certificate.id}/download`, { session: foreignSession, raw: true });
      assert.equal(download.status, 404);
    });

    await t.test('La consulta pública minimiza datos y verifica integridad', async () => {
      const publicLookup = await request(`certificates/public/${certificate.code}`);
      assert.equal(publicLookup.status, 200);
      assert.equal(publicLookup.body.code, certificate.code);
      assert.equal(publicLookup.body.status, 'encontrada');
      assert.equal(publicLookup.body.holder.includes('@'), false);
      assert.equal(publicLookup.body.email, undefined);
      assert.equal(publicLookup.body.ownerId, undefined);

      const download = await request(`certificates/${certificate.id}/download`, { session: ownerSession, raw: true });
      const validFile = new FormData();
      validFile.append('file', new Blob([download.bytes], { type: 'application/pdf' }), 'original.pdf');
      const valid = await request(`certificates/public/${certificate.code}/verify`, {
        method: 'POST',
        form: validFile,
      });
      assert.equal(valid.status, 200);
      assert.equal(valid.body.status, 'valida');

      const altered = Buffer.from(download.bytes);
      altered[altered.length - 2] ^= 1;
      const alteredFile = new FormData();
      alteredFile.append('file', new Blob([altered], { type: 'application/pdf' }), 'altered.pdf');
      const invalid = await request(`certificates/public/${certificate.code}/verify`, {
        method: 'POST',
        form: alteredFile,
      });
      assert.equal(invalid.status, 200);
      assert.equal(invalid.body.status, 'alterado');
      assert.equal(await db.certificateVerification.count({ where: { institutionId, result: 'consultada' } }), 1);

      const adminSession = await login(admin);
      const denied = await request('certificates/audit', { session: ownerSession });
      assert.equal(denied.status, 403);
      const audit = await request(`certificates/audit?code=${certificate.code}&action=valida`, { session: adminSession });
      assert.equal(audit.status, 200, JSON.stringify(audit.body));
      assert.equal(audit.body.total, 1);
      assert.equal(audit.body.items[0].action, 'valida');
      assert.equal(audit.body.items[0].code, certificate.code);

      const nonPdf = new FormData();
      nonPdf.append('file', new Blob(['not a PDF'], { type: 'application/pdf' }), 'bad.pdf');
      const notVerifiable = await request(`certificates/public/${certificate.code}/verify`, { method: 'POST', form: nonPdf });
      assert.equal(notVerifiable.status, 409);
      assert.equal(await db.certificateVerification.count({ where: { institutionId, result: 'archivo_no_verificable' } }), 1);
    });

    await t.test('Un ticket ajeno no permite emitir una constancia', async () => {
      const foreignSession = await login(foreign);
      const result = await request(`certificates/${ticketId}/issue`, { method: 'POST', body: {}, session: foreignSession });
      assert.equal(result.status, 404);
    });

    await t.test('Un código inexistente no revela datos', async () => {
      const result = await request('certificates/public/CITS-' + 'Z'.repeat(20));
      assert.equal(result.status, 404);
      assert.equal(result.body.email, undefined);
      assert.equal(result.body.ownerId, undefined);
    });
  } finally {
    await db.certificateVerification.deleteMany({ where: { institutionId } });
    await db.certificate.deleteMany({ where: { institutionId } });
    await db.ticket.deleteMany({ where: { institutionId } });
    await db.appUser.deleteMany({ where: { institutionId } });
    await db.institution.deleteMany({ where: { id: institutionId } });
    await app.close();
    if (priorFilesDir === undefined) delete process.env.FILES_DIR;
    else process.env.FILES_DIR = priorFilesDir;
    await rm(filesDir, { recursive: true, force: true });
  }
});
