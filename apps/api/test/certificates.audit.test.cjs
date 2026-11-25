require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { mkdir, readFile, rm, writeFile } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { CertificatesService } = require('../dist/certificates/certificates.service');

test('Constancias: emisión, auditoría, privacidad e integridad SHA-256', async t => {
  const code = 'CITS-' + 'A'.repeat(20);
  const institutionId = randomUUID();
  const ticketId = randomUUID();
  const ownerId = randomUUID();
  const certificateId = randomUUID();
  const testDir = join(tmpdir(), `campusitsm-certs-${certificateId}`);
  const priorFilesDir = process.env.FILES_DIR;
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
  const events = [];
  let auditWhere;
  const db = {
    certificate: {
      findUnique: async ({ where }) => where.code === code ? { ...row, owner: { displayName: 'Yasmin Zeta' } } : null,
      findFirst: async () => row,
      findMany: async () => [row],
    },
    certificateVerification: {
      create: async ({ data }) => { events.push(data); return { id: randomUUID(), ...data }; },
      findMany: async ({ where }) => { auditWhere = where; return [{ id: randomUUID(), ...events[0], occurredAt: issuedAt, certificate: { ticketCode: ticket.code } }]; },
      count: async ({ where }) => { auditWhere = where; return 1; },
    },
    $transaction: async operations => Promise.all(operations),
  };
  const service = new CertificatesService(db);
  const actor = { id: ownerId, institutionId, role: 'estudiante', active: true, permissions: ['certificates:request:self'] };
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
  row.sha256 = require('node:crypto').createHash('sha256').update(pdf).digest('hex');
  const filePath = join(testDir, row.storageKey);
  await mkdir(join(testDir, 'certificates', institutionId), { recursive: true });
  await writeFile(filePath, pdf);

  try {
    await t.test('Una emisión existente se reutiliza sin duplicar la auditoría', async () => {
      const first = await service.issue(actor, ticketId);
      const second = await service.issue(actor, ticketId);
      assert.equal(first.id, certificateId);
      assert.equal(second.id, first.id);
      assert.equal(events.length, 0);
    });

    await t.test('PDF original válido, alterado y no verificable se registran', async () => {
      const valid = await service.verifyPdf(code, pdf);
      assert.equal(valid.status, 'valida');
      assert.equal(valid.sha256Matches, true);

      const altered = Buffer.from(pdf);
      altered[altered.length - 2] ^= 1;
      const invalid = await service.verifyPdf(code, altered);
      assert.equal(invalid.status, 'alterado');
      assert.equal(invalid.sha256Matches, false);

      await assert.rejects(service.verifyPdf(code, Buffer.from('not a PDF')), error => error.getStatus() === 409);
      assert.deepEqual(events.map(event => event.result), ['valida', 'alterado', 'archivo_no_verificable']);
    });

    await t.test('La huella almacenada no se reescribe al detectar un archivo corrupto o ausente', async () => {
      const originalHash = row.sha256;
      const altered = Buffer.from(pdf);
      altered[altered.length - 2] ^= 1;
      await writeFile(filePath, altered);
      await assert.rejects(service.issue(actor, ticketId), error => error.getStatus() === 503 && error.response.code === 'CERTIFICATE_FILE_UNAVAILABLE');
      assert.equal(row.sha256, originalHash);

      await rm(filePath);
      await assert.rejects(service.issue(actor, ticketId), error => error.getStatus() === 503 && error.response.code === 'CERTIFICATE_FILE_UNAVAILABLE');
      assert.equal(row.sha256, originalHash);
    });

    await t.test('La consulta pública minimiza datos y queda auditada', async () => {
      const publicResult = await service.publicLookup(code);
      assert.equal(publicResult.code, code);
      assert.equal(publicResult.holder, 'Y***');
      assert.equal(publicResult.status, 'encontrada');
      assert.equal('email' in publicResult, false);
      assert.equal(events.at(-1).result, 'consultada');
    });

    await t.test('La consulta de auditoría filtra por institución, actor, fecha y acción', async () => {
      const admin = { ...actor, permissions: ['audit:read:institution'] };
      const result = await service.audit(admin, {
        page: '1',
        pageSize: '20',
        from: '2026-11-20T00:00:00.000Z',
        to: '2026-11-21T00:00:00.000Z',
        actorId: ownerId,
        code,
        action: 'emitida',
      });
      assert.equal(result.total, 1);
      assert.equal(auditWhere.institutionId, institutionId);
      assert.equal(auditWhere.actorId, ownerId);
      assert.equal(auditWhere.result, 'emitida');
      assert.equal(auditWhere.code.contains, code);
      await assert.rejects(service.audit(actor, {}), error => error.getStatus() === 403);
      await assert.rejects(service.audit(admin, { action: 'invalid' }), error => error.getStatus() === 400);
    });
  } finally {
    if (priorFilesDir === undefined) delete process.env.FILES_DIR;
    else process.env.FILES_DIR = priorFilesDir;
    await rm(testDir, { recursive: true, force: true });
  }
});
