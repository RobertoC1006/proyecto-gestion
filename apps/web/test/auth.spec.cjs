const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const shots = path.resolve(__dirname, '../../../docs/entregas/capturas/identidad');
fs.mkdirSync(shots, { recursive: true });
const fixtureUser = { id: '00000000-0000-4000-8000-000000000099', institutionId: '00000000-0000-4000-8000-000000000001', email: 'fixture@example.test', displayName: 'Prueba visual', role: 'estudiante', teamId: null, active: true, permissions: ['academic:read:self'] };
const json = (route, data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
async function fixture(page) {
  const state = { session: null, calls: [] };
  await page.route('**/api/v1/auth/**', async route => {
    const path = new URL(route.request().url()).pathname.split('/auth/')[1];
    state.calls.push({ path, method: route.request().method(), body: route.request().postDataJSON() });
    if (path === 'status') return json(route, { available: true, registrationEnabled: true, emailLinksRequired: true });
    if (path === 'me') return state.session ? json(route, state.session) : json(route, { code: 'SESSION_REQUIRED' }, 401);
    if (path === 'login') {
      if (route.request().postDataJSON().password === 'incorrecta') return json(route, { code: 'INVALID_CREDENTIALS', message: 'Revisa tu correo y contraseña.' }, 401);
      state.session = { user: fixtureUser, csrfToken: 'csrf-fixture-only' };
      return json(route, state.session);
    }
    if (path === 'register') return json(route, { message: 'Revisa el enlace enviado a tu correo y ábrelo en este navegador.' });
    if (path === 'recovery/request') return json(route, { message: 'Si la cuenta existe, recibirás un enlace de recuperación.' });
    if (path === 'recovery/status') return json(route, { csrfToken: 'csrf-recovery-fixture' });
    if (path === 'recovery/reset') return json(route, { message: 'Contraseña actualizada. Inicia sesión.' });
    if (path === 'logout') { state.session = null; return json(route, { message: 'Sesión cerrada.', providerRevoked: true }); }
    return json(route, {}, 404);
  });
  await page.route('**/api/v1/academic/me/events?*', route => json(route, { items: [], total: 0, page: 1, pageSize: 100 }));
  return state;
}
async function noOverflow(page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }

test('P01 real: formulario disponible, escritorio y móvil sin acceso ficticio', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Ingresa a CampusITSM' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeEnabled();
  await expect(page.getByText('¿Cómo deseas ingresar?')).toHaveCount(0);
  await expect(page.locator('.sidebar')).toHaveCount(0);
  await noOverflow(page);
  await page.screenshot({ path: path.join(shots, 'p01-escritorio-real.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await page.screenshot({ path: path.join(shots, 'p01-movil-real.png'), fullPage: true });
});
test('P01: errores, sesión del servidor y logout; sin tokens en almacenamiento del navegador', async ({ page }) => {
  const state = await fixture(page);
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('fixture@example.test');
  await page.locator('input[autocomplete="current-password"]').fill('incorrecta');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Revisa tu correo y contraseña');
  await page.locator('input[autocomplete="current-password"]').fill('Password-test-123');
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
  await expect(page.locator('input[autocomplete="current-password"]')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL('http://localhost:8080/');
  await expect(page.getByRole('heading', { name: 'Hola, Prueba visual', exact: true })).toBeVisible();
  await expect(page.locator('.profile-button__name')).toHaveText('Prueba visual');
  expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
  await page.getByLabel('Opciones de cuenta, Prueba visual').click();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(state.session).toBeNull();
});
test('P01: registro propio sin selector de privilegios y recuperación por enlace', async ({ page }) => {
  const state = await fixture(page);
  await page.goto('/login');
  await page.getByRole('button', { name: 'Regístrate', exact: true }).click();
  await page.getByLabel('Nombre y apellidos').fill('Prueba visual');
  await page.getByLabel('Correo electrónico').fill('fixture@example.test');
  await page.locator('input[autocomplete="new-password"]').fill('Password-test-123');
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await page.screenshot({ path: path.join(shots, 'p01-registro-fixture.png'), fullPage: true });
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Revisa el enlace');
  const registration = state.calls.find(c => c.path === 'register');
  expect(registration.body.role).toBeUndefined(); expect(registration.body.permissions).toBeUndefined();
  await page.getByRole('button', { name: 'Olvidé mi contraseña' }).click();
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByRole('status')).toContainText('recibirás un enlace');
  await page.goto('/login?recovery=1');
  await page.locator('input[autocomplete="new-password"]').fill('Nueva-password-123');
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await expect(page.getByRole('status')).toContainText('Contraseña actualizada');
  expect(state.calls.find(c => c.path === 'recovery/reset').body.password).toBe('Nueva-password-123');
});
