require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, randomBytes, createHash } = require('node:crypto');
const { mkdtemp, rename, writeFile, rm } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { Test } = require('@nestjs/testing');
const { UnauthorizedException } = require('@nestjs/common');
const { AppModule } = require('../dist/app.module');
const { AuthProvider } = require('../dist/auth/auth.provider');
const { AuthConfig } = require('../dist/auth/auth.config');
const { PrismaService } = require('../dist/database/prisma.service');

test('Constancias: HTTP con persistencia real aislada', async t => {
  assert.match(process.env.DATABASE_URL ?? '', /@db:5432\/workflow_test(?:\?|$)/);
  const files = await mkdtemp(join(tmpdir(), 'campusitsm-certificate-http-'));
  const previousFiles = process.env.FILES_DIR;
  process.env.FILES_DIR = files;
  const institutionId = randomUUID();
  const otherInstitutionId = randomUUID();
  const ownerId = randomUUID();
  const foreignId = randomUUID();
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
  const other = { id: randomUUID(), email: 'certificate-tenant@example.test', displayName: 'Otra Institución', role: 'estudiante' };
  const denied = { id: randomUUID(), email: 'certificate-denied@example.test', displayName: 'Sin permiso', role: 'ti_agente' };
  for (const identity of [owner, foreign, other, denied]) identities.set(identity.email, identity);

  async function request(path, { method = 'GET', body, session, raw = false } = {}) {
    const headers = {
      origin: 'http://localhost:8080',
      'content-type': 'application/json',
      ...(session ? { cookie: session.cookie, 'x-csrf-token': session.csrf } : {}),
    };
    const response = await fetch(`${base}/api/v1/${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (raw) return { status: response.status, bytes: Buffer.from(await response.arrayBuffer()), headers: response.headers };
    return { status: response.status, body: await response.json().catch(() => ({})), cookie: response.headers.get('set-cookie') };
  }

  async function login(user) {
    const result = await request('auth/login', { method: 'POST', body: { email: user.email, password: 'Password-test-123' } });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    return { cookie: result.cookie.split(';')[0], csrf: result.body.csrfToken };
  }

  async function resolvedTicket(overrides = {}) {
    return db.ticket.create({ data: {
      institutionId, ownerId, code: `INC-${randomUUID()}`, description:'Constancia aislada para comprobar recuperación segura.',
      service:'equipos',scope:'general',idempotencyKey:randomUUID(),requestHash:'0'.repeat(64),
      status:'resuelto',failureConfirmed:true,resolvedAt:new Date(),...overrides,
    } });
  }

  let ownerSession;
  let ticketId;
  let certificate;
  try {
    await db.institution.createMany({ data: [
      { id: institutionId, code: 'CERTIFICATE-TEST', name: 'Prueba aislada constancias' },
      { id: otherInstitutionId, code: otherInstitutionId, name: 'Otra institución aislada' },
    ] });
    await db.appUser.createMany({
      data: [
        { id: ownerId, institutionId, email: owner.email, displayName: owner.displayName, role: 'estudiante' },
        { id: foreignId, institutionId, email: foreign.email, displayName: foreign.displayName, role: 'estudiante' },
        { id: other.id, institutionId: otherInstitutionId, email: other.email, displayName: other.displayName, role: other.role },
        { id: denied.id, institutionId, email: denied.email, displayName: denied.displayName, role: denied.role },
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
      const mine = await request('certificates', { session: ownerSession });
      assert.equal(mine.status, 200);
      assert.deepEqual(mine.body.issued, [first.body]);
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
      assert.equal(download.headers.get('cache-control'), 'private, no-store');
      assert.equal(download.headers.get('content-disposition'), `attachment; filename="${certificate.code}.pdf"`);
      assert.equal(createHash('sha256').update(download.bytes).digest('hex'), certificate.sha256);
      const repeated = await request(`certificates/${certificate.id}/download`, { session: ownerSession, raw: true });
      assert.deepEqual(repeated.bytes, download.bytes);
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
      assert.deepEqual(publicLookup.body, {code:certificate.code,holder:'Y***',service:'Equipo de cómputo',
        resolvedAt:certificate.resolvedAt,issuedAt:certificate.issuedAt,status:'valida'});

      const download = await request(`certificates/${certificate.id}/download`, { session: ownerSession, raw: true });
      const valid = await request(`certificates/public/${certificate.code}/verify`, {
        method: 'POST',
        body: { pdfBase64: download.bytes.toString('base64') },
      });
      assert.equal(valid.status, 200);
      assert.equal(valid.body.status, 'valida');

      const altered = Buffer.from(download.bytes);
      altered[altered.length - 2] ^= 1;
      const invalid = await request(`certificates/public/${certificate.code}/verify`, {
        method: 'POST',
        body: { pdfBase64: altered.toString('base64') },
      });
      assert.equal(invalid.status, 200);
      assert.equal(invalid.body.status, 'alterado');
      const unreadable = await request(`certificates/public/${certificate.code}/verify`, {
        method:'POST',body:{pdfBase64:Buffer.from('no es PDF').toString('base64')},
      });
      assert.equal(unreadable.status, 409);
      assert.deepEqual(unreadable.body, {code:'FILE_NOT_VERIFIABLE',message:'El archivo no pudo verificarse.'});
    });

    await t.test('Un ticket ajeno no permite emitir una constancia', async () => {
      const foreignSession = await login(foreign);
      const result = await request(`certificates/${ticketId}/issue`, { method: 'POST', body: {}, session: foreignSession });
      assert.equal(result.status, 404);
    });

    await t.test('Institución ajena, falta de permiso y anonimato no cambian la emisión', async () => {
      const before = await request('certificates', { session: ownerSession });
      for (const [session, status] of [[await login(other), 404], [await login(denied), 403], [undefined, 401]]) {
        for (const path of [`certificates/${certificate.id}`, `certificates/${certificate.id}/download`, `certificates/${ticketId}/issue`]) {
          const issuing = path.endsWith('/issue');
          const result = await request(path, { session, method: issuing ? 'POST' : 'GET', body: issuing ? {} : undefined });
          assert.equal(result.status, status, JSON.stringify(result.body));
          assert.deepEqual(result.body, status === 401 ? {code:'SESSION_REQUIRED',message:'Necesitas una sesión válida.'}
            : status === 403 ? {code:'FORBIDDEN',message:'No tienes permiso para realizar esta operación.'}
            : issuing ? {code:'CERTIFICATE_NOT_ELIGIBLE',message:'El ticket no está disponible para emitir una constancia.'}
            : {code:'NOT_FOUND',message:'No se encontró la constancia.'});
        }
        assert.deepEqual((await request('certificates', { session: ownerSession })).body, before.body);
      }
    });

    for (const fault of ['ausente', 'corrupto']) await t.test(`PDF ${fault}: conserva emisión y verificación del original tras cambiar el nombre`, async () => {
      // Fixture fault only: the original bytes are kept in a backup in this test's private directory.
      const seeded = await resolvedTicket();
      const issued = await request(`certificates/${seeded.id}/issue`, { method:'POST',body:{},session:ownerSession });
      assert.equal(issued.status, 200, JSON.stringify(issued.body));
      const original = await request(`certificates/${issued.body.id}/download`, {session:ownerSession,raw:true});
      assert.equal(original.status, 200);
      assert.equal(createHash('sha256').update(original.bytes).digest('hex'), issued.body.sha256);
      // Simulate later profile/institution changes, not a certificate mutation.
      const changedName = fault === 'ausente' ? 'Nombre actualizado' : 'Cambio posterior';
      await db.appUser.update({where:{id:ownerId},data:{displayName:changedName}});
      await db.institution.update({where:{id:institutionId},data:{name:`Institución actualizada ${fault}`}});
      const before = (await request('certificates', {session:ownerSession})).body;
      const path = join(files, 'certificates', institutionId, `${seeded.id}.pdf`);
      await rename(path, path+'.original');
      try {
        if (fault === 'corrupto') await writeFile(path, Buffer.from('%PDF-contenido corrupto de prueba'));
        for (const endpoint of [`certificates/${issued.body.id}/download`, `certificates/${issued.body.id}`, `certificates/${seeded.id}/issue`]) {
          const issuing = endpoint.endsWith('/issue');
          const response = await request(endpoint, {session:ownerSession,method:issuing?'POST':'GET',body:issuing?{}:undefined});
          const stillIssued = (await request('certificates', {session:ownerSession})).body.issued.find(item => item.id === issued.body.id);
          assert.equal(stillIssued.sha256, issued.body.sha256, 'La recuperación no puede cambiar la huella de la emisión original');
          assert.equal(response.status, 503, JSON.stringify(response.body));
          assert.deepEqual(response.body, {code:'CERTIFICATE_FILE_UNAVAILABLE',message:'El PDF original no está disponible. La emisión y su huella se conservan para verificar el archivo original.'});
          assert.deepEqual((await request('certificates', {session:ownerSession})).body, before);
        }
        const lookup = await request(`certificates/public/${issued.body.code}`);
        assert.equal(lookup.status, 200);
        assert.deepEqual(lookup.body, {code:issued.body.code,holder:changedName[0]+'***',service:'Equipo de cómputo',resolvedAt:issued.body.resolvedAt,issuedAt:issued.body.issuedAt,status:'valida'});
        const valid = await request(`certificates/public/${issued.body.code}/verify`, {method:'POST',body:{pdfBase64:original.bytes.toString('base64')}});
        assert.equal(valid.status, 200);
        assert.deepEqual(valid.body, {code:issued.body.code,status:'valida',sha256Matches:true});
        const altered = Buffer.concat([original.bytes, Buffer.from('alterado')]);
        const invalid = await request(`certificates/public/${issued.body.code}/verify`, {method:'POST',body:{pdfBase64:altered.toString('base64')}});
        assert.equal(invalid.status, 200);
        assert.deepEqual(invalid.body, {code:issued.body.code,status:'alterado',sha256Matches:false});
        assert.deepEqual((await request('certificates', {session:ownerSession})).body, before);
      } finally {
        await rename(path+'.original', path);
      }
      const restored = await request(`certificates/${issued.body.id}/download`, {session:ownerSession,raw:true});
      assert.equal(restored.status, 200);
      assert.deepEqual(restored.bytes, original.bytes);
    });

    await t.test('Emisión simultánea reutiliza los mismos bytes y una única identidad', async () => {
      const ticket = await resolvedTicket();
      const results = await Promise.all([0, 1].map(() => request(`certificates/${ticket.id}/issue`, {method:'POST',body:{},session:ownerSession})));
      for (const result of results) assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.deepEqual(results[0].body, results[1].body);
      const mine = await request('certificates', {session:ownerSession});
      assert.equal(mine.status, 200);
      assert.deepEqual(mine.body.issued.filter(item => item.ticketId === ticket.id), [results[0].body]);
      const download = await request(`certificates/${results[0].body.id}/download`, {session:ownerSession,raw:true});
      assert.equal(download.status, 200);
      assert.equal(createHash('sha256').update(download.bytes).digest('hex'), results[0].body.sha256);
    });

    await t.test('Sin resolución o falla confirmada no se modifica la lista de emisiones', async () => {
      const before = (await request('certificates', {session:ownerSession})).body;
      for (const state of [{status:'registrado',resolvedAt:null}, {failureConfirmed:false}]) {
        const ticket = await resolvedTicket(state);
        const rejected = await request(`certificates/${ticket.id}/issue`, {method:'POST',body:{},session:ownerSession});
        assert.equal(rejected.status, 409);
        assert.deepEqual(rejected.body, {code:'CERTIFICATE_NOT_ELIGIBLE',message:'La constancia requiere un ticket resuelto y una falla confirmada.'});
        assert.deepEqual((await request('certificates', {session:ownerSession})).body, before);
      }
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
    await db.appUser.deleteMany({ where: { institutionId: { in: [institutionId, otherInstitutionId] } } });
    await db.institution.deleteMany({ where: { id: { in: [institutionId, otherInstitutionId] } } });
    await app.close();
    await rm(files, { recursive: true, force: true });
    if (previousFiles === undefined) delete process.env.FILES_DIR;
    else process.env.FILES_DIR = previousFiles;
  }
});
