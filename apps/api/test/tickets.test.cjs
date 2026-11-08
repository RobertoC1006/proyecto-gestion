const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { Prisma } = require('@prisma/client');
const { TicketsService } = require('../dist/tickets/tickets.service');
const { NestFactory } = require('@nestjs/core');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
const { AppModule } = require('../dist/app.module');

const owner = { id: '11111111-1111-4111-8111-111111111111',
  institutionId: '22222222-2222-4222-8222-222222222222' };
const key = '33333333-3333-4333-8333-333333333333';
const general = { description: 'No puedo acceder al correo institucional.', service: 'correo',
  scope: 'general', courseId: null, sectionId: null };
function fixture() {
  const rows = [];
  const db = { ticket: {
    findUnique: async ({ where }) => rows.find(t => t.institutionId === where.institutionId_ownerId_idempotencyKey.institutionId &&
      t.ownerId === where.institutionId_ownerId_idempotencyKey.ownerId &&
      t.idempotencyKey === where.institutionId_ownerId_idempotencyKey.idempotencyKey) || null,
    create: async ({ data }) => {
      // Simula dos solicitudes que alcanzaron simultáneamente la restricción única.
      await new Promise(resolve => setTimeout(resolve, 1));
      if (rows.some(t => t.institutionId === data.institutionId && t.ownerId === data.ownerId && t.idempotencyKey === data.idempotencyKey)) {
        throw new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002', clientVersion: '6.19.3', meta: { target: ['institutionId', 'ownerId', 'idempotencyKey'] },
        });
      }
      const row = { ...data, id: '44444444-4444-4444-8444-444444444444',
        status: 'registrado', classificationStatus: 'pendiente', createdAt: new Date(), updatedAt: new Date() };
      rows.push(row); return row;
    },
  }, academicCourse: { findFirst: async () => ({ id: 'course' }) },
    academicSection: { findFirst: async () => ({ id: 'section' }) },
    academicMembership: { findFirst: async () => ({ sectionId: 'section' }) } };
  return { service: new TicketsService(db), rows, db };
}

test('dos envíos simultáneos conservan un ticket y responden 201/200', async () => {
  const { service, rows } = fixture();
  const result = await Promise.all([service.create(owner, general, key), service.create(owner, general, key)]);
  assert.deepEqual(result.map(r => r.created).sort(), [false, true]);
  assert.equal(rows.length, 1);
  assert.equal(result[0].ticket.id, result[1].ticket.id);
  assert.match(result[0].ticket.code, /^INC-\d{4}-[0-9A-F]{24}$/);
  assert.equal(result[0].ticket.classificationStatus, 'pendiente');
  await assert.rejects(service.create(owner, { ...general, description: 'El servicio de correo sigue sin funcionar.' }, key),
    error => error.getResponse().code === 'IDEMPOTENCY_CONFLICT');
  assert.equal(rows.length, 1);
});

test('el curso exige asociación académica del titular', async () => {
  const { service, db, rows } = fixture();
  db.academicMembership.findFirst = async () => null;
  await assert.rejects(service.create(owner, { ...general, scope: 'curso',
    courseId: '55555555-5555-4555-8555-555555555555', sectionId: null }, key),
  error => error.getResponse().code === 'VALIDATION_ERROR');
  assert.equal(rows.length, 0);
});

test('listado y detalle restringen institución y titular', async () => {
  const { service, db } = fixture();
  let listWhere;
  db.ticket.findMany = async ({ where }) => { listWhere = where; return []; };
  db.ticket.count = async () => 0;
  db.$transaction = async operations => Promise.all(operations);
  const page = await service.list(owner, { page: '2', pageSize: '10' });
  assert.equal(listWhere.institutionId, owner.institutionId);
  assert.equal(listWhere.ownerId, owner.id);
  assert.equal(page.page, 2);
  db.ticket.findFirst = async ({ where }) => {
    assert.equal(where.institutionId, owner.institutionId);
    assert.equal(where.ownerId, owner.id);
    return null;
  };
  await assert.rejects(service.get(owner, '44444444-4444-4444-8444-444444444444'),
    error => error.getStatus() === 404);
});

test('OpenAPI se genera con las rutas de tickets', async () => {
  const app = await NestFactory.create(AppModule, { logger: false });
  try {
    app.setGlobalPrefix('api/v1');
    const document = SwaggerModule.createDocument(app, new DocumentBuilder()
      .addCookieAuth('campus_session', undefined, 'campus_session').build());
    assert.ok(document.paths['/api/v1/tickets']);
    assert.ok(document.paths['/api/v1/tickets/services']);
    assert.ok(document.paths['/api/v1/tickets/{id}']);
  } finally { await app.close(); }
});
