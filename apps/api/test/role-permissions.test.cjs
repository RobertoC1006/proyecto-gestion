require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { Test } = require('@nestjs/testing');
const { UnauthorizedException } = require('@nestjs/common');
const { AppModule } = require('../dist/app.module');
const { AuthProvider } = require('../dist/auth/auth.provider');
const { AuthConfig } = require('../dist/auth/auth.config');
const { RolePermissionsService } = require('../dist/auth/role-permissions.service');
const { IdentityDirectory } = require('../dist/auth/auth.directory');
const { rolePermissions } = require('../dist/auth/auth.policy');
const { PrismaService } = require('../dist/database/prisma.service');

test('Permisos por rol: persistencia y autorización real en PostgreSQL aislado', async t => {
  const institutionId = randomUUID(), otherInstitution = randomUUID(), users = new Map(), tokens = new Map();
  const config = new AuthConfig();
  Object.defineProperty(config, 'institutionCode', { value: 'ROLE-TEST' });
  const provider = {
    async login(email) { const user = users.get(email); if (!user) throw new UnauthorizedException(); const access = randomBytes(24).toString('hex'); tokens.set(access, user); return { access, refresh: 'test-only', expiresAt: Math.floor(Date.now() / 1000) + 3600 }; },
    async validate(token) { const user = tokens.get(token); if (!user) throw new UnauthorizedException(); return user; },
    async revoke() {},
  };
  async function createApp() {
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(AuthProvider).useValue(provider).overrideProvider(AuthConfig).useValue(config).compile();
    const app = module.createNestApplication({ logger: ['error'] }); app.setGlobalPrefix('api/v1'); await app.listen(0, '127.0.0.1'); return app;
  }
  const app = await createApp(), second = await createApp(), db = app.get(PrismaService);
  const base = await app.getUrl(), secondBase = await second.getUrl();
  async function request(path, { session, method = 'GET', body, headers = {}, target = base } = {}) {
    const response = await fetch(`${target}/api/v1/${path}`, { method, headers: { origin: 'http://localhost:8080', 'content-type': 'application/json', ...(session ? { cookie: session.cookie, 'x-csrf-token': session.csrf } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  async function login(email) { const r = await request('auth/login', { method: 'POST', body: { email, password: 'Password-test-123' } }); assert.equal(r.status, 200); return { cookie: r.cookie.split(';')[0], csrf: r.body.csrfToken }; }
  const identities = ['administrador', 'estudiante', 'docente'].map(role => ({ id: randomUUID(), email: `${role}-${randomUUID()}@example.test`, displayName: `Prueba ${role}`, role }));
  let admin, student, teacher;
  const update = (role, permissions, expectedVersion, session = admin, extra = {}) => request(`role-permissions/${role}`, { method: 'PATCH', session, body: { permissions, expectedVersion, reason: 'Cambio autorizado de prueba', ...extra } });
  try {
    await db.institution.createMany({ data: [{ id: institutionId, code: 'ROLE-TEST', name: 'Permisos de prueba' }, { id: otherInstitution, code: `R-${otherInstitution}`, name: 'Otra institución' }] });
    for (const identity of identities) { users.set(identity.email, identity); await db.appUser.create({ data: { ...identity, institutionId } }); }
    await db.roleAccess.create({ data: { institutionId: otherInstitution, role: 'docente', permissions: [], version: 8 } });
    admin = await login(identities[0].email); student = await login(identities[1].email); teacher = await login(identities[2].email);
    await t.test('Sin sesión ni rol administrador no se consulta ni edita la matriz', async () => {
      assert.equal((await request('role-permissions')).status, 401);
      assert.equal((await request('role-permissions', { session: student })).status, 403);
      assert.equal((await update('estudiante', [], 0, student)).status, 403);
      assert.equal((await request('role-permissions', { headers: { 'x-role': 'administrador' } })).status, 401);
    });
    await t.test('Tres roles visibles y capacidades del flujo: institución aislada', async () => {
      const r = await request('role-permissions', { session: admin }); assert.equal(r.status, 200);
      assert.deepEqual(r.body.roles.map(x=>x.role).sort(), ['administrador','docente','estudiante']);
      assert.equal(r.body.catalog.length, 17);
      const teacherRole = r.body.roles.find(role => role.role === 'docente');
      assert.equal(teacherRole.version, 0); assert.deepEqual(teacherRole.permissions, rolePermissions.docente);
    });
    await t.test('Origin y CSRF obligatorios; no hay escrituras rechazadas', async () => {
      for (const headers of [{ origin: 'https://attacker.example' }, { 'x-csrf-token': 'inventado' }]) {
        assert.equal((await request('role-permissions/docente', { session: admin, method: 'PATCH', headers, body: { permissions: [], expectedVersion: 0, reason: 'No debe guardar' } })).status, 403);
      }
      assert.equal(await db.rolePermissionChange.count({ where: { institutionId } }), 0);
    });
    await t.test('Validación de catálogo, alcances, dependencias y protección administrativa', async () => {
      assert.equal((await update('inventado', [], 0)).status, 400);
      assert.equal((await update('estudiante', ['users:manage'], 0)).status, 400);
      assert.equal((await update('estudiante', ['academic:read:self', 'academic:read:self'], 0)).status, 400);
      assert.equal((await update('docente', ['tickets:create'], 0)).status, 400);
      assert.equal((await update('administrador', [], 0)).status, 400);
      assert.equal((await update('docente', [], -1)).status, 400);
      assert.equal((await update('docente', [], 0, admin, { institutionId: otherInstitution })).status, 400);
      assert.equal((await update('docente', [], 0, admin, { reason: 'x' })).status, 400);
      assert.equal(await db.roleAccess.count({ where: { institutionId } }), 0);
    });
    await t.test('Guardar persiste, audita y cambia la misma sesión en dos servidores', async () => {
      const selected = ['academic:read:self', 'academic:teach', 'tickets:read:self'].sort();
      const r = await update('docente', selected, 0); assert.equal(r.status, 200); assert.equal(r.body.version, 1);
      for (const target of [base, secondBase]) {
        const me = await request('auth/me', { session: teacher, target }); assert.equal(me.status, 200);
        assert.deepEqual(me.body.user.permissions, selected);
      }
      const audit = await db.rolePermissionChange.findFirst({ where: { institutionId, role: 'docente' } });
      assert.equal(audit.actorId, identities[0].id); assert.equal(audit.reason, 'Cambio autorizado de prueba');
      assert.deepEqual(audit.before.permissions, rolePermissions.docente); assert.deepEqual(audit.after.permissions, selected);
      assert.equal((await update('docente', selected, 1)).status, 200);
      assert.equal(await db.rolePermissionChange.count({ where: { institutionId } }), 1);
      assert.equal((await db.roleAccess.findUnique({ where: { institutionId_role: { institutionId: otherInstitution, role: 'docente' } } })).version, 8);
    });
    await t.test('Dos ediciones simultáneas: solo una gana y la otra recibe conflicto', async () => {
      const results = await Promise.all([update('docente', [], 1), update('docente', ['academic:read:self'], 1)]);
      assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
      assert.equal(await db.rolePermissionChange.count({ where: { institutionId, role: 'docente' } }), 2);
      assert.equal((await update('docente', [], 0)).status, 409);
    });
    await t.test('Desmarcar calendario bloquea la API para administrador con la sesión existente', async () => {
      const selected = rolePermissions.administrador.filter(key => key !== 'academic:manage');
      assert.equal((await update('administrador', selected, 0)).status, 200);
      assert.equal((await request('academic/courses', { session: admin })).status, 403);
      assert.equal((await request('role-permissions', { session: admin })).status, 200);
      assert.equal((await update('administrador', rolePermissions.administrador, 1)).status, 200);
      assert.equal((await request('academic/courses', { session: admin })).status, 200);
    });
    await t.test('Retirar lectura personal también bloquea el calendario en el servidor', async () => {
      assert.equal((await update('estudiante', [], 0)).status, 200);
      assert.equal((await request('academic/me/courses', { session: student })).status, 403);
      const me = await request('auth/me', { session: student }); assert.equal(me.status, 200); assert.deepEqual(me.body.user.permissions, []);
    });
    await t.test('El servicio revalida al actor y rechaza una autorización anterior', async () => {
      const actor = await app.get(IdentityDirectory).principal(await db.appUser.findUnique({ where: { id: identities[0].id } }), true);
      await db.appUser.update({ where: { id: actor.id }, data: { role: 'docente' } });
      await assert.rejects(app.get(RolePermissionsService).update(actor, 'docente', { permissions: [], expectedVersion: 2, reason: 'Actor ya no administrador' }));
      await db.appUser.update({ where: { id: actor.id }, data: { role: 'administrador' } });
    });
  } finally {
    for (const model of ['rolePermissionChange', 'roleAccess', 'appUser']) await db[model].deleteMany({ where: { institutionId: { in: [institutionId, otherInstitution] } } });
    await db.institution.deleteMany({ where: { id: { in: [institutionId, otherInstitution] } } });
    await second.close(); await app.close();
  }
});
