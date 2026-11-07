require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { SupabaseAuthProvider } = require('../dist/auth/auth.provider');
const { AuthConfig } = require('../dist/auth/auth.config');

test('SDK oficial: PKCE de registro y recuperación se conserva exclusivamente en servidor', async () => {
  const original = global.fetch, calls = [];
  const user = { id: randomUUID(), email: 'sdk@example.test', aud: 'authenticated', role: 'authenticated', email_confirmed_at: new Date().toISOString(), created_at: new Date().toISOString(), app_metadata: {}, user_metadata: { display_name: 'Prueba SDK', role: 'administrador' } };
  const encode = data => Buffer.from(JSON.stringify(data)).toString('base64url');
  const access = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000), aud: 'authenticated' })}.c2lnbmF0dXJl`;
  const session = { access_token: access, refresh_token: 'refresh-sdk-test', expires_in: 3600, token_type: 'bearer', user };
  global.fetch = async (input, init) => {
    const url = new URL(String(input)), body = init?.body ? JSON.parse(init.body) : null;
    calls.push({ url, body, headers: init?.headers });
    const json = data => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (url.pathname.endsWith('/signup')) return json(user);
    if (url.pathname.endsWith('/recover')) return json({});
    if (url.pathname.endsWith('/token')) return json(session);
    if (url.pathname.endsWith('/user')) return json(user);
    if (url.pathname.endsWith('/logout')) return new Response(null, { status: 204 });
    throw new Error(`Ruta inesperada: ${url.pathname}`);
  };
  try {
    const provider = new SupabaseAuthProvider(new AuthConfig());
    const stored = await provider.register(user.email, 'Password-test-123', 'Prueba SDK');
    const signup = calls.find(c => c.url.pathname.endsWith('/signup'));
    assert.equal(signup.body.code_challenge_method, 's256');
    assert.ok(signup.url.searchParams.get('redirect_to').startsWith('http://localhost:8080/api/v1/auth/callback'));
    assert.ok(!stored.includes(access));
    await provider.exchange('auth-code-sdk', stored);
    const exchange = calls.find(c => c.url.searchParams.get('grant_type') === 'pkce');
    assert.equal(exchange.body.auth_code, 'auth-code-sdk');
    assert.equal(createHash('sha256').update(exchange.body.code_verifier).digest('base64url'), signup.body.code_challenge);
    const recoveryStorage = await provider.recover(user.email);
    const recover = calls.find(c => c.url.pathname.endsWith('/recover'));
    await provider.exchange('recovery-code-sdk', recoveryStorage);
    const last = calls.filter(c => c.url.searchParams.get('grant_type') === 'pkce').at(-1);
    assert.equal(createHash('sha256').update(last.body.code_verifier).digest('base64url'), recover.body.code_challenge);
    const identity = await provider.validate(access);
    assert.equal(identity.id, user.id); assert.equal(identity.role, undefined);
    const tokens = await provider.login(user.email, 'Password-test-123');
    await provider.changePassword(tokens, 'New-password-test-123');
    assert.ok(calls.some(c => c.url.pathname.endsWith('/logout') && c.url.searchParams.get('scope') === 'global'));
  } finally { global.fetch = original; }
});

test('Correo sin confirmar produce una indicación concreta sin exponer datos del proveedor', async () => {
  const original = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({ code: 'email_not_confirmed', msg: 'Email not confirmed' }), { status: 400, headers: { 'Content-Type': 'application/json', 'x-supabase-api-version': '2024-01-01' } });
  try {
    await assert.rejects(new SupabaseAuthProvider(new AuthConfig()).login('pending@example.test', 'Password-test-123'), error => error.getResponse().code === 'EMAIL_CONFIRMATION_REQUIRED');
  } finally { global.fetch = original; }
});
