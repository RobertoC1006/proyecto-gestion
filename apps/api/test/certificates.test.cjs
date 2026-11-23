require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { mkdtemp, rm } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { CertificatesService } = require('../dist/certificates/certificates.service');

test('Constancias: emisión reutilizable, huella e integridad', async t => {
  const institutionId = randomUUID(), ticketId = randomUUID(), ownerId = randomUUID(), certificateId = randomUUID();
  const testDir = await mkdtemp(join(tmpdir(), 'campusitsm-certs-'));
  const previousFiles = process.env.FILES_DIR;
  process.env.FILES_DIR = testDir;
  const ticket = {
    id: ticketId, code: 'INC-2026-ABC', service: 'equipos',
    createdAt: new Date('2026-11-20T08:00:00.000Z'), resolvedAt: new Date('2026-11-20T10:00:00.000Z'),
    status: 'resuelto', failureConfirmed: true, owner: { displayName: 'Yasmin Zeta' },
  };
  let stored;
  const db = {
    $queryRaw: async () => [],
    institution: { findUnique: async () => ({ name: 'Universidad Privada Tallán' }) },
    ticket: { findFirst: async () => ticket },
    certificate: {
      findFirst: async () => stored ?? null,
      findUnique: async ({ where }) => stored && (where.code === stored.code || where.ticketId === ticketId)
        ? { ...stored, owner: ticket.owner } : null,
      create: async ({ data }) => (stored = { id: certificateId, ...data }),
    },
    certificateVerification: { create: async () => ({ id: randomUUID() }) },
  };
  db.$transaction = async callback => callback(db);
  const service = new CertificatesService(db);
  const actor = { id: ownerId, institutionId, role: 'estudiante', active: true, permissions: [] };
  let issued;
  try {
    await t.test('Una emisión existente se reutiliza sin crear otra', async () => {
      issued = await service.issue(actor, ticketId);
      const second = await service.issue(actor, ticketId);
      assert.equal(issued.id, certificateId);
      assert.deepEqual(second, issued);
    });

    await t.test('El PDF generado tiene huella real y detecta alteración', async () => {
      const { bytes } = await service.download(actor, issued.id);
      assert.equal(bytes.subarray(0, 4).toString('ascii'), '%PDF');
      assert.equal(createHash('sha256').update(bytes).digest('hex'), issued.sha256);
      assert.deepEqual(await service.verifyPdf(issued.code, bytes.toString('base64')),
        { code: issued.code, status: 'valida', sha256Matches: true });
      const altered = Buffer.from(bytes);
      altered[altered.length - 2] ^= 1;
      assert.deepEqual(await service.verifyPdf(issued.code, altered.toString('base64')),
        { code: issued.code, status: 'alterado', sha256Matches: false });
    });

    await t.test('La consulta pública no expone datos privados', async () => {
      assert.deepEqual(await service.publicLookup(issued.code), {
        code: issued.code, holder: 'Y***', service: 'Equipo de cómputo',
        resolvedAt: ticket.resolvedAt.toISOString(), issuedAt: issued.issuedAt, status: 'valida',
      });
    });
  } finally {
    await rm(testDir, { recursive: true, force: true });
    if (previousFiles === undefined) delete process.env.FILES_DIR;
    else process.env.FILES_DIR = previousFiles;
  }
});

test('OpenAPI documents certificate download PDF success and unavailable original', async () => {
  const { NestFactory } = require('@nestjs/core');
  const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
  const { AppModule } = require('../dist/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  try {
    app.setGlobalPrefix('api/v1');
    const document = SwaggerModule.createDocument(app, new DocumentBuilder()
      .addCookieAuth('campus_session', undefined, 'campus_session').build());
    const { responses } = document.paths['/api/v1/certificates/{id}/download'].get;
    assert.deepEqual(Object.keys(responses).sort(), ['200', '503']);
    assert.deepEqual(responses['200'].content, {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    });
    assert.equal(responses['503'].description,
      'CERTIFICATE_FILE_UNAVAILABLE: el PDF original no está disponible; la emisión y su huella se conservan.');
  } finally {
    await app.close();
  }
});
