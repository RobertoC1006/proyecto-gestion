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
  } finally {
    await db.ticket.deleteMany({ where: { institutionId } });
    await db.appUser.deleteMany({ where: { institutionId } });
    await db.supportTeam.deleteMany({ where: { institutionId } });
    await db.institution.deleteMany({ where: { id: institutionId } });
    await app.close();
  }
});
