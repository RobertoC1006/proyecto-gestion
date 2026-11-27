const { test } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const { evidenceInput, MAX_EVIDENCE_BYTES } = require('../dist/tickets/ticket-attachment.validation');
const { TicketAttachmentService } = require('../dist/tickets/ticket-attachment.service');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');

const owner = { id: '11111111-1111-4111-8111-111111111111', institutionId: '22222222-2222-4222-8222-222222222222' };
const stranger = { ...owner, id: '33333333-3333-4333-8333-333333333333' };
const id = '44444444-4444-4444-8444-444444444444';
const body = (name, mimeType, bytes) => ({ originalName: name, mimeType, contentBase64: bytes.toString('base64') });
function fixture() {
  let item = null, failCreate = false, failCommit = false;
  const objects = new Map();
  const storage = {
    put: async (key, bytes) => { objects.set(key, bytes); },
    get: async key => { if (!objects.has(key)) throw Error('missing'); return objects.get(key); },
    remove: async key => { objects.delete(key); },
  };
  const db = {
    ticket: { findFirst: async ({ where }) => where.id === id && where.ownerId === owner.id && where.institutionId === owner.institutionId ? { id } : null },
    ticketAttachment: { findUnique: async ({ where }) => item && (item.ticketId === where.ticketId || item.storageKey === where.storageKey) ? item : null },
    $transaction: async fn => {
      const result = await fn({ $queryRaw: async () => [{ id }], ticketAttachment: {
        findUnique: async () => item,
        create: async ({ data }) => { if (failCreate) throw Error('insert failed'); item = { ...data, id: '55555555-5555-4555-8555-555555555555', createdAt: new Date() }; return item; },
      } });
      if (failCommit) throw Error('commit uncertain');
      return result;
    },
  };
  return { service: new TicketAttachmentService(db, storage), storage, objects,
    failCreate: () => { failCreate = true; }, failCommit: () => { failCommit = true; }, item: () => item };
}

test('valida PNG, JPEG y PDF reales; rechaza MIME, extensión, truncamiento y Base64', async () => {
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#008800' } }).png().toBuffer();
  const jpg = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#008800' } }).jpeg().toBuffer();
  const pdfDocument = await PDFDocument.create(); pdfDocument.addPage();
  const pdf = Buffer.from(await pdfDocument.save());
  for (const [name, mime, bytes] of [['captura.png','image/png',png], ['foto.jpg','image/jpeg',jpg], ['documento.pdf','application/pdf',pdf]]) {
    const valid = await evidenceInput(body(name, mime, bytes));
    assert.equal(valid.bytes.length, bytes.length);
    assert.match(valid.sha256, /^[0-9a-f]{64}$/);
  }
  for (const invalid of [body('captura.pdf','image/png',png), body('foto.png','image/png',jpg),
    body('foto.jpg','image/jpeg',jpg.subarray(0, jpg.length - 5)),
    { ...body('captura.png','image/png',png), contentBase64: 'AA=A' },
    body('../captura.png','image/png',png), body('vacio.png','image/png',Buffer.alloc(0))]) {
    await assert.rejects(evidenceInput(invalid));
  }
  assert.equal(MAX_EVIDENCE_BYTES, 5_242_880);
  const maximumPdf = Buffer.concat([pdf.subarray(0, pdf.length - 5), Buffer.alloc(MAX_EVIDENCE_BYTES - pdf.length, 32), pdf.subarray(pdf.length - 5)]);
  assert.equal((await evidenceInput(body('limite.pdf','application/pdf',maximumPdf))).bytes.length, MAX_EVIDENCE_BYTES);
  await assert.rejects(evidenceInput(body('grande.pdf','application/pdf',Buffer.alloc(MAX_EVIDENCE_BYTES + 1))), error => error.getStatus() === 413);
});

test('un adjunto se guarda una vez; reintento idéntico 200 y cambio 409', async () => {
  const { service, objects } = fixture();
  const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: '#ffffff' } }).png().toBuffer();
  const first = await service.attach(owner, id, body('captura.png', 'image/png', png));
  const retry = await service.attach(owner, id, body('captura.png', 'image/png', png));
  assert.equal(first.created, true); assert.equal(retry.created, false);
  assert.deepEqual(first.attachment, retry.attachment); assert.equal(objects.size, 1);
  assert.ok(!JSON.stringify(first).includes('storageKey'));
  await assert.rejects(service.attach(owner, id, body('otra.png','image/png',png)), error => error.getStatus() === 409);
  await assert.rejects(service.attach(stranger, id, body('captura.png','image/png',png)), error => error.getStatus() === 404);
  assert.equal((await service.download(owner, id)).bytes.equals(png), true);
});

test('fallo de inserción limpia solo el objeto nuevo; COMMIT incierto conserva el enlazado', async () => {
  const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: '#ffffff' } }).png().toBuffer();
  const failed = fixture(); failed.failCreate();
  await assert.rejects(failed.service.attach(owner, id, body('captura.png','image/png',png)), error => error.getStatus() === 503);
  assert.equal(failed.objects.size, 0);
  const uncertain = fixture(); uncertain.failCommit();
  await assert.rejects(uncertain.service.attach(owner, id, body('captura.png','image/png',png)), error => error.getStatus() === 503);
  assert.equal(uncertain.objects.size, 1);
  assert.ok(uncertain.item());
});

if (process.env.DATABASE_URL?.includes('@db:')) test('la migración aislada impone 5 MiB e índice académico', async () => {
  const db = new PrismaClient();
  try {
    const constraints = await db.$queryRawUnsafe(`SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conname = 'TicketAttachment_size_max_5mib'`);
    assert.equal(constraints.length, 1);
    assert.match(constraints[0].definition, /5242880/);
    const indexes = await db.$queryRawUnsafe(`SELECT indexname FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'Ticket_institutionId_courseId_sectionId_idx'`);
    assert.equal(indexes.length, 1);
  } finally { await db.$disconnect(); }
});

if (process.env.DATABASE_URL?.includes('@db:')) test('dos solicitudes simultáneas crean una sola fila y un solo objeto', async () => {
  const db = new PrismaClient();
  const institutionId = randomUUID(), userId = randomUUID(), ticketId = randomUUID();
  const principal = { id: userId, institutionId };
  const objects = new Map();
  const storage = {
    put: async (key, bytes) => { objects.set(key, bytes); },
    get: async key => objects.get(key),
    remove: async key => { objects.delete(key); },
  };
  const service = new TicketAttachmentService(db, storage);
  const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: '#ffffff' } }).png().toBuffer();
  try {
    await db.institution.create({ data: { id: institutionId, code: `EVID-${institutionId.slice(0, 8)}`, name: 'Prueba aislada' } });
    await db.appUser.create({ data: { id: userId, institutionId, email: `test-${userId}@example.invalid`, displayName: 'Prueba', role: 'estudiante' } });
    await db.ticket.create({ data: { id: ticketId, institutionId, ownerId: userId, code: `INC-${ticketId.slice(0, 12)}`, description: 'Reporte ficticio de prueba aislada', service: 'correo', scope: 'general', idempotencyKey: randomUUID(), requestHash: 'a'.repeat(64) } });
    const results = await Promise.all([service.attach(principal, ticketId, body('captura.png', 'image/png', png)),
      service.attach(principal, ticketId, body('captura.png', 'image/png', png))]);
    assert.deepEqual(results.map(r => r.created).sort(), [false, true]);
    assert.equal(await db.ticketAttachment.count({ where: { ticketId } }), 1);
    assert.equal(objects.size, 1);
  } finally {
    await db.ticketAttachment.deleteMany({ where: { ticketId } });
    await db.ticket.deleteMany({ where: { id: ticketId } });
    await db.appUser.deleteMany({ where: { id: userId } });
    await db.institution.deleteMany({ where: { id: institutionId } });
    await db.$disconnect();
  }
});
