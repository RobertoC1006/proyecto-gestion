require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { Test } = require('@nestjs/testing');
const { UnauthorizedException } = require('@nestjs/common');
const { AppModule } = require('../dist/app.module');
const { AuthProvider } = require('../dist/auth/auth.provider');
const { AuthConfig } = require('../dist/auth/auth.config');
const { PrismaService } = require('../dist/database/prisma.service');

test('P15: endpoints HTTP con PostgreSQL aislado', async t => {
  assert.equal(new URL(process.env.DATABASE_URL).hostname, 'db');
  const institutionId = randomUUID();
  const teamId = randomUUID();
  const foreignTeamId = randomUUID();
  const identities = new Map();
  const tokens = new Map();
  const config = new AuthConfig();
  Object.defineProperty(config, 'institutionCode', { value: 'REPORTS-TEST' });
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

  const admin = { id: randomUUID(), email: 'reports-admin@example.test', displayName: 'Admin reportes', role: 'administrador' };
  const supervisor = { id: randomUUID(), email: 'reports-supervisor@example.test', displayName: 'Supervisor reportes', role: 'ti_supervisor' };
  const student = { id: randomUUID(), email: 'reports-student@example.test', displayName: 'Estudiante reportes', role: 'estudiante' };
  identities.set(admin.email, admin);
  identities.set(supervisor.email, supervisor);
  identities.set(student.email, student);

  async function request(path, { method = 'GET', body, session } = {}) {
    const response = await fetch(`${base}/api/v1/${path}`, {
      method,
      headers: {
        origin: 'http://localhost:8080',
        'content-type': 'application/json',
        ...(session ? { cookie: session.cookie, 'x-csrf-token': session.csrf } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    return { status: response.status, body: parsed, cookie: response.headers.get('set-cookie') };
  }
  async function login(user) {
    const result = await request('auth/login', { method: 'POST', body: { email: user.email, password: 'Password-test-123' } });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    return { cookie: result.cookie.split(';')[0], csrf: result.body.csrfToken };
  }

  try {
    await db.institution.create({ data: { id: institutionId, code: 'REPORTS-TEST', name: 'Reportes aislados' } });
    await db.supportTeam.createMany({
      data: [
        { id: teamId, institutionId, code: 'TEAM-A', name: 'Equipo A' },
        { id: foreignTeamId, institutionId, code: 'TEAM-B', name: 'Equipo B' },
      ],
    });
    await db.appUser.createMany({
      data: [
        { id: admin.id, institutionId, email: admin.email, displayName: admin.displayName, role: 'administrador' },
        { id: supervisor.id, institutionId, email: supervisor.email, displayName: supervisor.displayName, role: 'ti_supervisor', teamId },
        { id: student.id, institutionId, email: student.email, displayName: student.displayName, role: 'estudiante', teamId },
      ],
    });
    await db.ticket.createMany({
      data: [
        {
          institutionId, ownerId: student.id, code: 'INC-REPORT-1', description: 'Ticket real aislado uno.',
          service: 'correo', scope: 'general', idempotencyKey: randomUUID(), requestHash: '1'.repeat(64),
          status: 'resuelto', resolvedAt: new Date('2026-11-12T10:00:00Z'), resolutionDueAt: new Date('2026-11-12T12:00:00Z'),
          failureConfirmed: true, createdAt: new Date('2026-11-10T10:00:00Z'),
        },
        {
          institutionId, ownerId: student.id, code: 'INC-REPORT-2', description: 'Ticket real aislado dos.',
          service: 'equipos', scope: 'general', idempotencyKey: randomUUID(), requestHash: '2'.repeat(64),
          status: 'registrado', createdAt: new Date('2026-11-13T10:00:00Z'),
        },
      ],
    });

    const adminSession = await login(admin);
    const supervisorSession = await login(supervisor);
    const studentSession = await login(student);

    await t.test('Administrador obtiene conteos reales y no pronóstico', async () => {
      const result = await request(`reports?from=2026-11-01T00:00:00Z&to=2026-11-20T23:59:59Z&period=week&scope=institution`, { session: adminSession });
      assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.equal(result.body.total, 2);
      assert.equal(result.body.resolved, 1);
      assert.equal(result.body.resolutionRate, 50);
      assert.equal(result.body.resolvedWithinSlaRate, 100);
      assert.equal(result.body.synthetic, false);
      assert.equal(result.body.forecastStatus, 'unavailable');
      assert.equal(result.body.categories.length, 2);
    });

    await t.test('Supervisor puede consultar su equipo y estudiante no puede', async () => {
      const team = await request(`reports?from=2026-11-01T00:00:00Z&to=2026-11-20T23:59:59Z&period=week&scope=team`, { session: supervisorSession });
      assert.equal(team.status, 200, JSON.stringify(team.body));
      assert.equal(team.body.total, 2);
      const denied = await request(`reports?scope=institution`, { session: studentSession });
      assert.equal(denied.status, 403);
    });

    await t.test('Exportación usa los filtros autorizados', async () => {
      const exportResult = await request(`reports/export?from=2026-11-01T00:00:00Z&to=2026-11-20T23:59:59Z&period=week&scope=institution&service=correo`, { session: adminSession });
      assert.equal(exportResult.status, 200);
      assert.match(exportResult.body, /Correo institucional/);
      assert.doesNotMatch(exportResult.body, /equipos/);
      const denied = await request(`reports/export?scope=institution`, { session: studentSession });
      assert.equal(denied.status, 403);
    });

    await t.test('Filtros inválidos y datos fuera de alcance se rechazan', async () => {
      const invalid = await request(`reports?period=year&scope=institution`, { session: adminSession });
      assert.equal(invalid.status, 400);
      const reverse = await request(`reports?from=2026-11-20T00:00:00Z&to=2026-11-01T00:00:00Z&scope=institution`, { session: adminSession });
      assert.equal(reverse.status, 400);
    });
    await t.test('Origen sintético sigue exactamente filtros y límites autorizados', async () => {
      const otherInstitution = randomUUID();
      const otherOwner = randomUUID();
      const otherTeamOwner = randomUUID();
      await db.institution.create({ data: { id: otherInstitution, code: 'REPORTS-FOREIGN', name: 'Otra institución' } });
      try {
        await db.appUser.createMany({ data: [
          { id: otherOwner, institutionId: otherInstitution, email: 'foreign@example.test', displayName: 'Ajeno', role: 'estudiante' },
          { id: otherTeamOwner, institutionId, teamId: foreignTeamId, email: 'other-team@example.test', displayName: 'Otro equipo', role: 'estudiante' },
        ] });
        const seed = (ownerId, tenant, code, service, day) => ({
          institutionId: tenant, ownerId, code, description: 'Demostración aislada de reportes.',
          service, scope: 'general', status: 'registrado', isDemo: true,
          idempotencyKey: randomUUID(), requestHash: 'd'.repeat(64), createdAt: new Date(day),
        });
        await db.ticket.createMany({ data: [
          seed(student.id, institutionId, 'INC-DEMO-OWN', 'wifi_red', '2026-11-15T10:00:00Z'),
          seed(otherTeamOwner, institutionId, 'INC-DEMO-TEAM', 'impresoras', '2026-11-16T10:00:00Z'),
          seed(otherOwner, otherInstitution, 'INC-DEMO-FOREIGN', 'correo', '2026-11-10T10:00:00Z'),
        ] });
        const query = 'from=2026-11-01T00:00:00Z&to=2026-11-20T23:59:59Z&period=day';
        for (const [filters, total, synthetic] of [
          ['scope=institution', 4, true], ['scope=team', 3, true],
          ['scope=institution&service=wifi_red', 1, true],
          ['scope=institution&service=correo', 1, false],
          ['scope=institution&status=resuelto', 1, false],
          ['scope=team&service=impresoras', 0, false],
          ['scope=institution&service=otro', 0, false],
          ['scope=institution&from=2026-11-15T10:00:00Z&to=2026-11-15T10:00:01Z', 1, true],
          ['scope=institution&to=2026-11-14T23:59:59Z', 2, false],
          ['scope=institution&from=2026-11-17T00:00:00Z', 0, false],
        ]) {
          const params = new URLSearchParams(query);
          for (const [key, value] of new URLSearchParams(filters)) params.set(key, value);
          const session = params.get('scope') === 'team' ? supervisorSession : adminSession;
          const report = await request(`reports?${params}`, { session });
          assert.equal(report.status, 200, JSON.stringify(report.body));
          assert.equal(report.body.total, total, filters);
          assert.equal(report.body.synthetic, synthetic, filters);
          assert.equal(report.body.series.reduce((n, row) => n + row.observed, 0), total);
          assert.equal(report.body.categories.reduce((n, row) => n + row.count, 0), total);
          const csv = await request(`reports/export?${params}`, { session });
          assert.equal(csv.status, 200);
          const series = csv.body.split(String.fromCharCode(13, 10)).slice(1).filter(line => line.includes('tickets-operational'));
          assert.ok(series.length);
          assert.ok(series.every(line => line.endsWith(`"${synthetic}"`)), filters);
        }
        const before = await request(`reports?${query}`, { session: adminSession });
        for (const path of ['reports', 'reports/export']) {
          assert.equal((await request(`${path}?${query}&service=invalid`, { session: adminSession })).status, 400);
          assert.equal((await request(`${path}?${query}`, { session: studentSession })).status, 403);
          assert.equal((await request(`${path}?${query}`)).status, 401);
          assert.equal((await request(`${path}?${query}&scope=institution`, { session: supervisorSession })).status, 400);
        }
        assert.deepEqual((await request(`reports?${query}`, { session: adminSession })).body, before.body);
      } finally {
        await db.ticket.deleteMany({ where: { OR: [{ institutionId: otherInstitution }, { code: { startsWith: 'INC-DEMO-' }, institutionId }] } });
        await db.appUser.deleteMany({ where: { id: { in: [otherOwner, otherTeamOwner] } } });
        await db.institution.delete({ where: { id: otherInstitution } });
      }
    });
  } finally {
    await db.ticket.deleteMany({ where: { institutionId } });
    await db.appUser.deleteMany({ where: { institutionId } });
    await db.supportTeam.deleteMany({ where: { institutionId } });
    await db.institution.deleteMany({ where: { id: institutionId } });
    await app.close();
  }
});
