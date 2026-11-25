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

// Same Nest/AuthProvider/Prisma fixture seam as privacy.test.cjs; no shared DB.
test('Audit HTTP: cross-source cursor collision and repeatable-read export', { timeout: 60000 }, async t => {
  assert.equal(new URL(process.env.DATABASE_URL).hostname, 'db');
  assert.equal(new URL(process.env.DATABASE_URL).pathname, '/workflow_test');
  const institutionId = randomUUID(), foreignInstitution = randomUUID();
  const admin = { id: randomUUID(), email: 'snapshot-admin@example.test', displayName: 'Snapshot Admin', role: 'administrador' };
  const foreign = { id: randomUUID(), email: 'snapshot-foreign@example.test', displayName: 'Foreign Admin', role: 'administrador' };
  const identities = new Map([admin, foreign].map(user => [user.email, user])), tokens = new Map();
  const config = new AuthConfig();
  Object.defineProperty(config, 'institutionCode', { value: 'AUDIT-SNAPSHOT' });
  const provider = {
    async login(email) {
      const user = identities.get(email);
      if (!user) throw new UnauthorizedException();
      const access = randomBytes(24).toString('hex');
      tokens.set(access, user);
      return { access, refresh: 'isolated-test', expiresAt: Math.floor(Date.now() / 1000) + 3600 };
    },
    async validate(token) { const user = tokens.get(token); if (!user) throw new UnauthorizedException(); return user; },
    async revoke() {},
  };
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AuthProvider).useValue(provider)
    .overrideProvider(AuthConfig).useValue(config).compile();
  const app = module.createNestApplication({ logger: false });
  app.setGlobalPrefix('api/v1');
  let pauseFirstBatch;
  app.use((req, res, next) => {
    if (pauseFirstBatch && req.path === '/api/v1/audit/export') {
      const paused = pauseFirstBatch;
      pauseFirstBatch = undefined;
      const write = res.write.bind(res);
      let held = false;
      res.write = function (chunk, ...args) {
        // The header precedes the first SELECT and cannot establish the snapshot.
        // Hold only the first DATA write: its SELECT has completed, and the
        // controller will await drain before asking the service for batch two.
        if (!held && String(chunk).startsWith('\r\n')) {
          held = true;
          Promise.resolve().then(() => paused(String(chunk))).then(() => {
            if (write(chunk, ...args)) res.emit('drain');
          }).catch(error => { synchronizationError = error; res.destroy(error); });
          return false;
        }
        return write(chunk, ...args);
      };
    }
    next();
  });
  let synchronizationError;
  await app.listen(0, '127.0.0.1');
  const db = app.get(PrismaService), base = await app.getUrl();
  let session;
  async function request(path, { method = 'GET', body } = {}) {
    const response = await fetch(`${base}/api/v1/${path}`, {
      method, signal: AbortSignal.timeout(20000),
      headers: { origin: 'http://localhost:8080', 'content-type': 'application/json', ...(session ? { cookie: session.cookie, 'x-csrf-token': session.csrf } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    return { status: response.status, body: parsed, cookie: response.headers.get('set-cookie'), contentType: response.headers.get('content-type') };
  }
  const uuid = (prefix, n) => `${prefix}-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
  const key = row => `${row.id}|${row.action}`;
  const csvKeys = body => body.split('\r\n').slice(1).map(line => {
    // Fixtures have no commas/quotes/newlines, so each field is simply quoted.
    const cells = line.split(',').map(value => value.slice(1, -1));
    assert.equal(cells.length, 8);
    assert.equal(cells[2], admin.id);
    assert.equal(cells[3], admin.displayName);
    return `${cells[0]}|${cells[4]}`;
  });
  const academic = (id, entityType, createdAt, overrides = {}) => ({ id, institutionId, actorId: admin.id,
    entityType, entityId: admin.id, action: 'create', reason: 'Prueba segura', createdAt, ...overrides });
  async function pages(query, expected) {
    const seen = [];
    for (let page = 1; page <= Math.ceil(expected.length / 37) + 1; page++) {
      const result = await request(`audit?${query}&pageSize=37&page=${page}`);
      assert.equal(result.status, 200);
      assert.equal(result.body.total, expected.length);
      assert.equal(result.body.page, page);
      assert.equal(result.body.pageSize, 37);
      assert.ok(result.body.items.every(row => row.actorId === admin.id && row.actor === admin.displayName));
      seen.push(...result.body.items.map(key));
      if (page === Math.ceil(expected.length / 37) + 1) assert.deepEqual(result.body.items, []);
    }
    assert.deepEqual(seen, expected);
    assert.equal(new Set(seen).size, expected.length);
  }
  try {
    await db.institution.createMany({ data: [{ id: institutionId, code: 'AUDIT-SNAPSHOT', name: 'Snapshot test' }, { id: foreignInstitution, code: 'AUDIT-SNAPSHOT-OTHER', name: 'Foreign test' }] });
    await db.appUser.createMany({ data: [{ ...admin, institutionId }, { ...foreign, institutionId: foreignInstitution }] });
    const login = await request('auth/login', { method: 'POST', body: { email: admin.email, password: 'Password-test-123' } });
    assert.equal(login.status, 200);
    session = { cookie: login.cookie.split(';')[0], csrf: login.body.csrfToken };

    await t.test('Same UUID/time from two sources survives the 100-row cursor boundary, filters and tenant scope', async () => {
      const stamp = new Date('2024-01-01T00:00:00.000Z');
      const shared = uuid('80000000', 1);
      const high = Array.from({ length: 99 }, (_, i) => uuid('f0000000', 99 - i));
      const low = Array.from({ length: 101 }, (_, i) => uuid('10000000', 101 - i));
      await db.academicChange.createMany({ data: [...high, shared, ...low].map(id => academic(id, 'CollisionProbe', stamp)) });
      await db.identityChange.create({ data: { id: shared, institutionId, actorId: admin.id, subjectId: admin.id,
        reason: 'Prueba segura', before: {}, after: {}, createdAt: stamp } });
      await db.academicChange.createMany({ data: [
        academic(uuid('ff000000', 1), 'CollisionProbe', stamp, { institutionId: foreignInstitution, actorId: foreign.id }),
        academic(uuid('ff000000', 2), 'CollisionProbe', stamp, { entityId: randomUUID() }),
      ] });
      const query = `from=${stamp.toISOString()}&to=2024-01-01T00:00:01.000Z&objectId=${admin.id}`;
      // source DESC: IdentityChange (2) precedes AcademicChange (1).
      // The shared pair is exactly rows 100/101 in the CSV cursor stream.
      const expected = [...high.map(id => `${id}|create`), `${shared}|access.change`, `${shared}|create`, ...low.map(id => `${id}|create`)];
      await pages(query, expected);
      const csv = await request(`audit/export?${query}`);
      assert.equal(csv.status, 200);
      assert.equal(csv.contentType, 'text/csv; charset=utf-8');
      assert.deepEqual(csvKeys(csv.body), expected);
      assert.equal(new Set(csvKeys(csv.body)).size, 202);
      const filtered = expected.filter(value => value.endsWith('|create'));
      await pages(`${query}&action=create&objectType=CollisionProbe&actorId=${admin.id}`, filtered);
      const filteredCsv = await request(`audit/export?${query}&action=create&objectType=CollisionProbe&actorId=${admin.id}`);
      assert.equal(filteredCsv.status, 200);
      assert.deepEqual(csvKeys(filteredCsv.body), filtered);
      const foreignOnly = await request(`audit?${query}&actorId=${foreign.id}`);
      assert.equal(foreignOnly.status, 200);
      assert.equal(foreignOnly.body.total, 0);
      assert.deepEqual(foreignOnly.body.items, []);
    });

    await t.test('An event committed between export batches is excluded from snapshot but visible to later HTTP list', async () => {
      const stamp = new Date('2024-02-01T00:00:00.000Z');
      const ids = Array.from({ length: 205 }, (_, i) => uuid('40000000', 410 - 2 * i));
      const added = uuid('40000000', 211); // Below row 100 (212), above row 101 (210).
      await db.academicChange.createMany({ data: ids.map(id => academic(id, 'SnapshotProbe', stamp)) });
      const query = `objectType=SnapshotProbe&objectId=${admin.id}&action=create&actorId=${admin.id}`;
      const expected = ids.map(id => `${id}|create`);
      await pages(query, expected);
      let insertions = 0;
      pauseFirstBatch = async chunk => {
        assert.deepEqual(csvKeys(`header${chunk}`), expected.slice(0, 100));
        await db.academicChange.create({ data: academic(added, 'SnapshotProbe', stamp) });
        insertions++;
        // A separate public request proves the insert committed before drain.
        const visible = await request(`audit?${query}&pageSize=1`);
        assert.equal(visible.status, 200);
        assert.equal(visible.body.total, 206);
      };
      const csv = await request(`audit/export?${query}`);
      assert.equal(synchronizationError, undefined);
      assert.equal(insertions, 1, 'the first data block must establish the timing barrier');
      assert.equal(pauseFirstBatch, undefined);
      assert.equal(csv.status, 200);
      assert.deepEqual(csvKeys(csv.body), expected);
      assert.equal(new Set(csvKeys(csv.body)).size, 205);
      const later = [...expected.slice(0, 100), `${added}|create`, ...expected.slice(100)];
      await pages(query, later);
    });
  } finally {
    await db.academicChange.deleteMany({ where: { institutionId: { in: [institutionId, foreignInstitution] } } });
    await db.identityChange.deleteMany({ where: { institutionId: { in: [institutionId, foreignInstitution] } } });
    await db.appUser.deleteMany({ where: { institutionId: { in: [institutionId, foreignInstitution] } } });
    await db.institution.deleteMany({ where: { id: { in: [institutionId, foreignInstitution] } } });
    await app.close();
  }
});
