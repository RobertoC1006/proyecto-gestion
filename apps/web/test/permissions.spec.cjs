const { test, expect } = require('@playwright/test');
const path = require('node:path');
const original = require('./fixtures/role-matrix.json');
const screenshots = path.resolve(__dirname, '../../../.local/verification/roles-permisos');

async function fixture(page, role = 'administrador') {
  const matrix = structuredClone(original);
  const state = { matrix, writes: [], requests: [], conflict: false, failure: false, loadFailure: false };
  const user = { id: '00000000-0000-4000-8000-000000000099', institutionId: '00000000-0000-4000-8000-000000000001', email: 'fixture@example.test', displayName: 'Prueba permisos', role, active: true, teamId: null, permissions: matrix.roles.find(item => item.role === role).permissions };
  await page.route('**/api/v1/**', async route => {
    const endpoint = new URL(route.request().url()).pathname.split('/api/v1/')[1];
    state.requests.push(endpoint);
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (endpoint === 'auth/me') return json({ user, csrfToken: 'csrf-fixture' });
    if (endpoint === 'role-permissions') return state.loadFailure ? json({ message: 'No se pudo cargar la matriz.' }, 503) : json(matrix);
    if (endpoint.startsWith('role-permissions/')) {
      const role = endpoint.split('/')[1], body = route.request().postDataJSON(); state.writes.push({ role, body });
      const current = matrix.roles.find(item => item.role === role);
      if (state.conflict) { state.conflict = false; current.version++; return json({ code: 'CONFLICT', message: 'Este rol cambió. Actualiza la matriz antes de guardar.' }, 409); }
      if (state.failure) return json({ message: 'No se pudieron guardar los permisos.' }, 503);
      if (body.expectedVersion !== current.version) return json({ code: 'CONFLICT', message: 'Este rol cambió.' }, 409);
      Object.assign(current, { permissions: body.permissions, version: current.version + 1, updatedAt: new Date().toISOString() });
      if (user.role === role) user.permissions = [...body.permissions];
      return json(current);
    }
    return json({ items: [], total: 0, page: 1, pageSize: 100 });
  });
  return state;
}
const checkbox = (page, label) => page.getByRole('checkbox', { name: new RegExp(`^${label}`) });

test('Casillas por acción: guarda el rol con motivo y conserva el cambio al recargar', async ({ page }) => {
  const state = await fixture(page);
  await page.goto('/admin/permisos');
  await expect(page.getByRole('heading', { name: 'Roles y permisos', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar permisos', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Incidencias', exact: true }).click();
  await checkbox(page, 'Registrar incidencias').uncheck();
  await expect(page.getByRole('status')).toHaveText('Cambios sin guardar');
  await page.getByLabel('Motivo del cambio').fill('Retirar registro para esta demostración de prueba.');
  await page.getByRole('button', { name: 'Guardar permisos', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Permisos de Estudiante guardados.');
  expect(state.writes).toHaveLength(1);
  expect(state.writes[0].body.expectedVersion).toBe(0);
  expect(state.writes[0].body.permissions).not.toContain('tickets:create');
  expect(state.writes[0].body.permissions).toContain('tickets:read:self');
  await page.reload();
  await page.getByRole('button', { name: 'Incidencias', exact: true }).click();
  await expect(checkbox(page, 'Registrar incidencias')).not.toBeChecked();
});

test('Agrupación parcial, dependencias de consulta y permisos protegidos', async ({ page }) => {
  await fixture(page);
  await page.goto('/admin/permisos');
  await page.getByRole('button', { name: 'Incidencias', exact: true }).click();
  await checkbox(page, 'Consultar mis incidencias').uncheck();
  await expect(checkbox(page, 'Registrar incidencias')).not.toBeChecked();
  await checkbox(page, 'Registrar incidencias').check();
  await expect(checkbox(page, 'Consultar mis incidencias')).toBeChecked();
  await page.getByRole('button', { name: 'Usuarios', exact: true }).click();
  await expect(checkbox(page, 'Administrar usuarios y sus roles')).toBeDisabled();
  await page.getByRole('button', { name: 'Administrador Permisos del rol', exact: true }).click();
  await page.getByRole('button', { name: 'Usuarios', exact: true }).click();
  await expect(checkbox(page, 'Administrar usuarios y sus roles')).toBeChecked();
  await expect(checkbox(page, 'Administrar usuarios y sus roles')).toBeDisabled();
  const reports = page.getByRole('checkbox', { name: 'Reportes: Consultar', exact: true });
  expect(await reports.evaluate(input => input.indeterminate)).toBe(true);
  await reports.check();
  expect(await reports.evaluate(input => input.indeterminate)).toBe(false);
  await page.getByRole('button', { name: 'Reportes', exact: true }).click();
  await expect(checkbox(page, 'Consultar reportes del equipo')).toBeChecked();
  await expect(checkbox(page, 'Consultar reportes de la institución')).toBeChecked();
});

test('Cambios sin guardar: permite cancelar o confirmar salida y cambio de rol', async ({ page }) => {
  await fixture(page);
  await page.goto('/admin/permisos');
  await page.getByRole('checkbox', { name: 'Calendario académico: Consultar', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Docente Permisos del rol', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page.getByRole('button', { name: 'Estudiante Permisos del rol' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Descartar y continuar' }).click();
  await expect(page).toHaveURL('http://localhost:8080/');
});

test('Conflicto: no sobrescribe la edición local y permite recargar antes de guardar', async ({ page }) => {
  const state = await fixture(page); state.conflict = true;
  await page.goto('/admin/permisos');
  const read = page.getByRole('checkbox', { name: 'Calendario académico: Consultar', exact: true });
  await read.uncheck();
  await page.getByLabel('Motivo del cambio').fill('Edición concurrente de prueba.');
  await page.getByRole('button', { name: 'Guardar permisos', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Este rol cambió');
  await expect(read).not.toBeChecked();
  await page.getByRole('button', { name: 'Actualizar matriz' }).click();
  await page.getByRole('button', { name: 'Descartar y continuar' }).click();
  await expect(read).toBeChecked();
  await read.uncheck();
  await page.getByLabel('Motivo del cambio').fill('Nueva edición sobre la versión actual.');
  await page.getByRole('button', { name: 'Guardar permisos', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Permisos de Estudiante guardados.');
  expect(state.writes[1].body.expectedVersion).toBe(1);
});

test('Fallos de carga y guardado: reintento sin perder la selección', async ({ page }) => {
  const state = await fixture(page); state.loadFailure = true;
  await page.goto('/admin/permisos');
  await expect(page.getByRole('alert')).toContainText('No se pudo cargar');
  state.loadFailure = false;
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  const read = page.getByRole('checkbox', { name: 'Calendario académico: Consultar', exact: true });
  await read.uncheck();
  await page.getByLabel('Motivo del cambio').fill('Prueba de recuperación del guardado.');
  state.failure = true;
  await page.getByRole('button', { name: 'Guardar permisos', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudieron guardar');
  await expect(read).not.toBeChecked();
  state.failure = false;
  await page.getByRole('button', { name: 'Guardar permisos', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Permisos de Estudiante guardados.');
});

test('Cambiar mi rol actualiza el menú y el dashboard sin cerrar mi sesión', async ({ page }) => {
  await fixture(page);
  await page.goto('/admin/permisos');
  await page.getByRole('button', { name: 'Administrador Permisos del rol', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Calendario académico: Administrar', exact: true }).uncheck();
  await page.getByLabel('Motivo del cambio').fill('Retirar gestión de calendario para prueba.');
  await page.getByRole('button', { name: 'Guardar permisos', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Permisos de Administrador guardados.');
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('link', { name: 'Calendario académico', exact: true })).toHaveAttribute('href', '/calendario');
  await expect(nav.getByRole('link', { name: 'Permisos', exact: true })).toBeVisible();
  await nav.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.locator('.home-page').getByRole('link', { name: /^Calendario académico/ })).toHaveAttribute('href', '/calendario');
});

test('Búsqueda, escritorio y móvil con tabla desplazable sin desbordar la página', async ({ page }) => {
  await fixture(page);
  await page.goto('/admin/permisos');
  await page.getByRole('button', { name: 'Administrador Permisos del rol', exact: true }).click();
  await page.getByRole('button', { name: 'Incidencias', exact: true }).click();
  await page.screenshot({ path: path.join(screenshots, 'matriz-escritorio-fixture.png'), fullPage: true, animations: 'disabled' });
  await page.getByLabel('Buscar permisos o módulos').fill('constancias');
  await expect(page.getByRole('button', { name: 'Constancias', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Calendario académico', exact: true })).toHaveCount(0);
  await page.getByLabel('Buscar permisos o módulos').fill('sin coincidencias');
  await expect(page.getByRole('heading', { name: 'No encontramos permisos' })).toBeVisible();
  await page.getByLabel('Buscar permisos o módulos').fill('');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.sidebar')).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: path.join(screenshots, 'matriz-movil-fixture.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('region', { name: 'Tabla de permisos, desplazamiento horizontal' }).evaluate(element => { element.scrollLeft = element.scrollWidth; });
  await expect(page.getByRole('checkbox', { name: 'Calendario académico: Administrar', exact: true })).toBeInViewport();
});

test('Un alumno no consulta la matriz y el servidor real la protege sin sesión', async ({ page, request }) => {
  const state = await fixture(page, 'estudiante');
  await page.goto('/admin/permisos');
  await expect(page.getByRole('alert')).toContainText('No tienes permiso');
  expect(state.requests).not.toContain('role-permissions');
  expect((await request.get('/api/v1/role-permissions')).status()).toBe(401);
});
