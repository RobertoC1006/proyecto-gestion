require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ReportsService } = require('../dist/reports/reports.service');

function principal(overrides = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    institutionId: '22222222-2222-4222-8222-222222222222',
    teamId: '33333333-3333-4333-8333-333333333333',
    active: true,
    permissions: ['reports:read:team'],
    role: 'ti_supervisor',
    ...overrides,
  };
}

test('P15 reportes: conteos reales, porcentajes y ausencia de pronóstico', async () => {
  let capturedWhere;
  const db = {
    ticket: {
      findMany: async ({ where }) => {
        capturedWhere = where;
        return [
          { id: '1', code: 'INC-1', service: 'correo', status: 'resuelto', priority: 'P2', createdAt: new Date('2026-11-10T10:00:00Z'), resolvedAt: new Date('2026-11-11T10:00:00Z'), resolutionDueAt: new Date('2026-11-12T10:00:00Z'), failureConfirmed: true },
          { id: '2', code: 'INC-2', service: 'correo', status: 'registrado', priority: 'P3', createdAt: new Date('2026-11-12T10:00:00Z'), resolvedAt: null, resolutionDueAt: null, failureConfirmed: false },
          { id: '3', code: 'INC-3', service: 'equipos', status: 'en_atencion', priority: 'P1', createdAt: new Date('2026-11-13T10:00:00Z'), resolvedAt: null, resolutionDueAt: null, failureConfirmed: false },
        ];
      },
    },
  };
  const service = new ReportsService(db);
  const report = await service.report(principal(), {
    from: '2026-11-01T00:00:00Z',
    to: '2026-11-20T23:59:59Z',
    period: 'week',
  });

  assert.equal(report.total, 3);
  assert.equal(report.registered, 1);
  assert.equal(report.inAttention, 1);
  assert.equal(report.resolved, 1);
  assert.equal(report.resolutionRate, 33.3);
  assert.equal(report.resolvedWithinSlaRate, 100);
  assert.equal(report.source, 'tickets-operational');
  assert.equal(report.synthetic, false);
  assert.equal(report.forecastStatus, 'unavailable');
  assert.deepEqual(report.categories.map(item => [item.service, item.count]), [['correo', 2], ['equipos', 1]]);
  assert.equal(report.series.every(item => item.forecast === null), true);
  assert.equal(capturedWhere.owner.teamId, '33333333-3333-4333-8333-333333333333');
});

test('P15 reportes: sin datos usa nulos y rechaza intervalos inválidos', async () => {
  const db = { ticket: { findMany: async () => [] } };
  const service = new ReportsService(db);
  const report = await service.report(principal(), {
    from: '2026-11-01T00:00:00Z',
    to: '2026-11-20T23:59:59Z',
    period: 'month',
  });
  assert.equal(report.total, 0);
  assert.equal(report.resolutionRate, null);
  assert.equal(report.resolvedWithinSlaRate, null);
  assert.deepEqual(report.categories, []);
  await assert.rejects(
    () => service.report(principal(), { from: '2026-11-20T00:00:00Z', to: '2026-11-20T00:00:00Z', period: 'day' }),
    error => error.getResponse().code === 'VALIDATION_ERROR',
  );
});

test('P15 reportes: alcance institucional exige permiso efectivo', async () => {
  const db = { ticket: { findMany: async () => [] } };
  const service = new ReportsService(db);
  await assert.rejects(
    () => service.report(principal({ permissions: ['reports:read:team'] }), { scope: 'institution' }),
    error => error.getStatus() === 400,
  );
});

test('P15 rechaza un alcance desconocido o ajeno a las capacidades efectivas', async () => {
  const db = { ticket: { findMany: async () => assert.fail('No debe consultar tickets fuera del alcance') } };
  const service = new ReportsService(db);
  const administrator = principal({ permissions: ['reports:read:institution'] });
  for (const scope of ['unknown', 'team']) {
    await assert.rejects(
      () => service.report(administrator, { scope }),
      error => error.getStatus() === 400 && Boolean(error.getResponse().fields.scope),
    );
  }
});

test('P15 exportación usa CSV y no incluye pronóstico falso', async () => {
  const db = { ticket: { findMany: async () => [] } };
  const service = new ReportsService(db);
  const csv = await service.export(principal({ permissions: ['reports:read:institution'], teamId: null }), {
    from: '2026-11-01T00:00:00Z',
    to: '2026-11-20T23:59:59Z',
    period: 'week',
  });
  assert.match(csv, /periodo,observado,pronosticado,origen,fuente_sintetica/);
  assert.match(csv, /tickets-operational","false/);
  assert.doesNotMatch(csv, /,[1-9][0-9]*,tickets-operational/);
});


test('P15 CSV conserva origen sintetico de la poblacion seleccionada', async () => {
  const db = { ticket: { findMany: async () => [{
    id: 'demo', service: 'correo', status: 'registrado', isDemo: true,
    createdAt: new Date('2026-11-10T10:00:00Z'),
  }] } };
  const service = new ReportsService(db);
  const csv = await service.export(principal(), {
    from: '2026-11-01T00:00:00Z', to: '2026-11-20T23:59:59Z', period: 'month',
  });
  assert.equal(csv, [
    'periodo,observado,pronosticado,origen,fuente_sintetica',
    '"2026-11-01","1","","tickets-operational","true"',
    '', 'categoria,cantidad,porcentaje', '"Correo institucional","1","100"',
  ].join(String.fromCharCode(13, 10)));
});
