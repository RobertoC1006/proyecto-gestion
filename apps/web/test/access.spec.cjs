const { test, expect } = require('@playwright/test');
const path = require('node:path');

const permissions = {
  estudiante: ['academic:read:self', 'tickets:create', 'tickets:read:self', 'certificates:request:self'],
  docente: ['academic:teach', 'academic:read:self', 'tickets:create', 'tickets:read:self', 'certificates:request:self'],
  ti_agente: ['academic:read:self', 'tickets:read:team', 'tickets:work:team'],
  ti_supervisor: ['academic:read:self', 'tickets:read:team', 'tickets:work:team', 'tickets:assign:team', 'reports:read:team'],
  administrador: ['academic:read:self', 'academic:manage', 'users:manage', 'permissions:manage', 'reports:read:institution', 'audit:read:institution', 'configuration:manage', 'tickets:read:institution', 'tickets:work:institution'],
};
const sessionFor = role => ({ user: { id: '00000000-0000-4000-8000-000000000099', institutionId: '00000000-0000-4000-8000-000000000001', email: 'fixture@example.test', displayName: 'Cuenta de prueba', role, active: true, teamId: null, permissions: permissions[role] }, csrfToken: 'csrf-fixture' });
const screenshots = path.resolve(__dirname, '../../../.local/verification/acceso-navegacion');
async function fixture(page, session = null) {
  const state = { session, calls: [], sessionStatus: 200 };
  await page.route('**/api/v1/**', async route => {
    const endpoint = new URL(route.request().url()).pathname.split('/api/v1/')[1];
    state.calls.push(endpoint);
    let status = 200, data = { items: [], total: 0, page: 1, pageSize: 100 };
    if (endpoint === 'auth/me') {
      status = state.sessionStatus !== 200 ? state.sessionStatus : state.session ? 200 : 401;
      data = state.session || { code: 'SESSION_REQUIRED' };
    }
    if (endpoint === 'auth/status') data = { available: true, registrationEnabled: true };
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  });
  return state;
}

test('Entrada sin sesión: ni el panel ni su contenido se montan mientras se comprueba el acceso', async ({ page }) => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await fixture(page);
  await page.route('**/api/v1/auth/me', async route => {
    await pending;
    return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/');
  try {
    await expect(page.getByRole('status')).toHaveText('Comprobando tu sesión…');
    await expect(page.locator('.app-shell')).toHaveCount(0);
    await expect(page.getByText('Hola, Johan', { exact: false })).toHaveCount(0);
  } finally { release(); }
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Ingresa a CampusITSM' })).toBeVisible();
  await expect(page.locator('.sidebar')).toHaveCount(0);
});

test('Direcciones privadas sin sesión vuelven al acceso antes de consultar datos', async ({ page }) => {
  const state = await fixture(page);
  for (const url of ['/incidencias', '/incidencias/nueva', '/ti/cola', '/admin/calendario/nuevo']) {
    await page.goto(url);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('.app-shell')).toHaveCount(0);
  }
  expect(state.calls.every(call => call.startsWith('auth/'))).toBe(true);
});

for (const role of Object.keys(permissions)) {
  test(`Menú y dashboard privado para ${role}`, async ({ page }) => {
    const state = await fixture(page, sessionFor(role));
    await page.goto('/');
    await expect(page).toHaveURL('http://localhost:8080/');
    await expect(page.getByRole('heading', { name: 'Hola, Cuenta de prueba', exact: true })).toBeVisible();
    const home = page.locator('.home-page');
    await expect(home.locator('.stats-grid, .ticket-grid')).toHaveCount(0);
    await expect(home.getByText('Actividad reciente', { exact: true })).toHaveCount(0);
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Calendario académico', exact: true })).toBeVisible();
    await expect(home.getByRole('link', { name: /^Calendario académico/ })).toHaveAttribute('href', role === 'administrador' ? '/admin/calendario' : '/calendario');
    await expect(nav.getByRole('link', { name: 'Mis incidencias', exact: true })).toHaveCount(['estudiante', 'docente'].includes(role) ? 1 : 0);
    await expect(nav.getByRole('link', { name: 'Cola de TI', exact: true })).toHaveCount(role === 'administrador' ? 1 : 0);
    for (const label of ['Usuarios', 'Permisos', 'Auditoría', 'Prioridades y SLA']) {
      await expect(nav.getByText(label, { exact: true })).toHaveCount(role === 'administrador' ? 1 : 0);
      await expect(home.getByText(label, { exact: true })).toHaveCount(role === 'administrador' ? 1 : 0);
    }
    await expect(home.getByRole('link', { name: /^Mis incidencias/ })).toHaveCount(['estudiante', 'docente'].includes(role) ? 1 : 0);
    await expect(home.getByRole('link', { name: /^Cola de TI/ })).toHaveCount(role === 'administrador' ? 1 : 0);
    await expect(nav.getByText('Reportes', { exact: true })).toHaveCount(['administrador', 'ti_supervisor'].includes(role) ? 1 : 0);
    await expect(nav.locator('.sidebar__secondary')).toHaveCount(role === 'administrador' ? 1 : 0);
    expect(state.calls.every(call => call.startsWith('auth/') || (['estudiante','docente'].includes(role) && (call.startsWith('tickets') || call.startsWith('academic/me/'))))).toBe(true);
  });
}

test('Alumno: escribir la dirección administrativa o de TI no monta pantallas ni consulta sus datos', async ({ page }) => {
  const state = await fixture(page, sessionFor('estudiante'));
  for (const url of ['/admin/calendario', '/admin/calendario/nuevo', '/admin/calendario/ejemplo/editar', '/admin/permisos', '/ti/cola', '/ti/tickets/ejemplo']) {
    await page.goto(url);
    await expect(page.getByRole('alert')).toHaveText('No tienes permiso para acceder a este módulo.');
    await expect(page.getByRole('button', { name: 'Validar y guardar' })).toHaveCount(0);
    await expect(page.getByText('Cola de atención TI', { exact: true })).toHaveCount(0);
  }
  expect(state.calls.every(call => call.startsWith('auth/'))).toBe(true);
});

test('El menú y las rutas usan permisos efectivos, no solo la etiqueta del rol', async ({ page }) => {
  const session = sessionFor('administrador');
  session.user.permissions = ['academic:read:self'];
  await fixture(page, session);
  await page.goto('/');
  await expect(page).toHaveURL('http://localhost:8080/');
  await expect(page.locator('.home-page').getByRole('link', { name: /^Calendario académico/ })).toHaveAttribute('href', '/calendario');
  await expect(page.getByRole('navigation').getByText('Usuarios', { exact: true })).toHaveCount(0);
  await page.goto('/admin/calendario');
  await expect(page.getByRole('alert')).toContainText('No tienes permiso');
});

test('Fallo al comprobar sesión: permite reintentar y nunca muestra el panel', async ({ page }) => {
  const state = await fixture(page);
  state.sessionStatus = 503;
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('No pudimos comprobar tu sesión');
  await expect(page.locator('.app-shell')).toHaveCount(0);
  state.sessionStatus = 200;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('Sesión vencida: retira el panel y vuelve al acceso', async ({ page }) => {
  const state = await fixture(page, sessionFor('estudiante'));
  await page.goto('/calendario');
  await expect(page.locator('.app-shell')).toBeVisible();
  state.session = null;
  await page.evaluate(() => window.dispatchEvent(new Event('campus:session-expired')));
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('.app-shell')).toHaveCount(0);
});

test('127.0.0.1 redirige al origen local configurado conservando ruta y parámetros', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:8080/login?confirmed=1', { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe('http://localhost:8080/login?confirmed=1');
});

test('Entrada real por la IP local termina en login sin panel, en escritorio y móvil', async ({ page }) => {
  // Sin sustituir respuestas de la API ni iniciar sesión con una cuenta real.
  await page.goto('http://127.0.0.1:8080/');
  await expect(page).toHaveURL('http://localhost:8080/login');
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeEnabled();
  await expect(page.locator('.app-shell')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.screenshot({ path: path.join(screenshots, 'entrada-real-escritorio.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.sidebar')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: path.join(screenshots, 'entrada-real-movil.png'), fullPage: true });
});

test('Alumno en móvil: el menú solo contiene sus módulos y permite cerrarlo', async ({ page }) => {
  await fixture(page, sessionFor('estudiante'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/calendario');
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link')).toHaveText(['Dashboard', 'Tickets', 'Calendario académico']);
  await expect(nav.getByRole('link', { name: 'Calendario académico', exact: true })).toBeInViewport();
  await page.screenshot({ path: path.join(screenshots, 'alumno-menu-movil-fixture.png'), fullPage: true, animations: 'disabled' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
});

test('Dashboard del administrador: recarga, login ya autenticado y capturas de escritorio/móvil', async ({ page }) => {
  const session = sessionFor('administrador');
  session.user.displayName = 'Roberto Carlos';
  await fixture(page, session);
  await page.goto('/login');
  await expect(page).toHaveURL('http://localhost:8080/');
  await expect(page.getByRole('heading', { name: 'Hola, Roberto Carlos', exact: true })).toBeVisible();
  await expect(page.locator('.home-page').getByText('Usuarios', { exact: true })).toBeVisible();
  await expect(page.locator('.home-page').getByRole('link', { name: /^Usuarios/ })).toHaveAttribute('href', '/admin/usuarios');
  await page.screenshot({ path: path.join(screenshots, 'dashboard-admin-escritorio-fixture.png'), fullPage: true, animations: 'disabled' });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hola, Roberto Carlos', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.sidebar')).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByRole('heading', { name: 'Hola, Roberto Carlos', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: path.join(screenshots, 'dashboard-admin-movil-fixture.png'), fullPage: true, animations: 'disabled' });
  await page.locator('.home-page').getByRole('link', { name: /^Calendario académico/ }).click();
  await expect(page).toHaveURL(/\/admin\/calendario$/);
});

test('Dashboard sin capacidades asignadas: explica el estado y solo ofrece el inicio', async ({ page }) => {
  const session = sessionFor('estudiante');
  session.user.permissions = [];
  await fixture(page, session);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Todavía no tienes herramientas asignadas' })).toBeVisible();
  await expect(page.locator('.home-module')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link')).toHaveText(['Dashboard']);
});
