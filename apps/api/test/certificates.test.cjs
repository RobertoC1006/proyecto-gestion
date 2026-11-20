require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createHash } = require('node:crypto');
const { mkdir, readFile, rm } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { CertificatesService } = require('../dist/certificates/certificates.service');

test('Constancias: emisión reutilizable, huella e integridad', async t => {
  const code = 'CITS-' + 'A'.repeat(20);
  const institutionId = randomUUID();
  const ticketId = randomUUID();
  const ownerId = randomUUID();
  const certificateId = randomUUID();
  const testDir = join(tmpdir(), `campusitsm-certs-${certificateId}`);
  process.env.FILES_DIR = testDir;
  const resolvedAt = new Date('2026-11-20T10:00:00.000Z');
  const issuedAt = new Date('2026-11-20T11:00:00.000Z');
  const ticket = {
    id: ticketId,
    code: 'INC-2026-ABC',
    service: 'equipos',
    createdAt: new Date('2026-11-20T08:00:00.000Z'),
  };
  const row = {
    id: certificateId,
    institutionId,
    ticketId,
    ownerId,
    code,
    ticketCode: ticket.code,
    service: ticket.service,
    resolvedAt,
    issuedAt,
    sha256: '',
    storageKey: `certificates/${institutionId}/${ticketId}.pdf`,
  };

  const db = {
    institution: { findUnique: async () => ({ name: 'Universidad Privada Tallán' }) },
    ticket: { findUnique: async () => ({ ...ticket, owner: { displayName: 'Yasmin Zeta' } }) },
    certificate: {
      findUnique: async ({ where }) => where.code === code ? { ...row, owner: { displayName: 'Yasmin Zeta' } } : null,
      findFirst: async () => row,
      findMany: async () => [row],
      update: async () => row,
    },
    certificateVerification: { create: async () => ({ id: randomUUID() }) },
  };
  const service = new CertificatesService(db);

  await t.test('Una emisión existente se reutiliza sin crear otra', async () => {
    const first = await service.issue({ id: ownerId, institutionId, role: 'estudiante', active: true, permissions: [] }, ticketId);
    const second = await service.issue({ id: ownerId, institutionId, role: 'estudiante', active: true, permissions: [] }, ticketId);
    assert.equal(first.id, certificateId);
    assert.equal(second.id, first.id);
  });

  await t.test('El PDF generado tiene huella real y detecta alteración', async () => {
    const pdf = await service.createPdf({
      code,
      ticketCode: ticket.code,
      service: ticket.service,
      ownerName: 'Yasmin Zeta',
      resolvedAt,
      issuedAt,
      institutionId,
      institutionName: 'Universidad Privada Tallán',
      ticketCreatedAt: ticket.createdAt,
    });
    const sha256 = createHash('sha256').update(pdf).digest('hex');
    row.sha256 = sha256;
    db.certificate.findUnique = async ({ where }) => where.code === code ? { ...row, owner: { displayName: 'Yasmin Zeta' } } : null;

    const valid = await service.verifyPdf(code, pdf.toString('base64'));
    assert.equal(valid.status, 'valida');
    assert.equal(valid.sha256Matches, true);

    const altered = Buffer.from(pdf);
    altered[altered.length - 2] ^= 1;
    const invalid = await service.verifyPdf(code, altered.toString('base64'));
    assert.equal(invalid.status, 'alterado');
    assert.equal(invalid.sha256Matches, false);
  });

  await t.test('La consulta pública no expone datos privados', async () => {
    const publicResult = await service.publicLookup(code);
    assert.equal(publicResult.code, code);
    assert.equal(publicResult.holder, 'Y***');
    assert.equal('email' in publicResult, false);
  });

  await rm(testDir, { recursive: true, force: true });
});
