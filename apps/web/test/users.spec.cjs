const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');
const initialUsers = [
  { id: '00000000-0000-4000-8000-000000000101', institutionId: '00000000-0000-4000-8000-000000000001', email: 'ana@example.test', displayName: 'Ana Torres', role: 'docente', active: true, teamId: null, team: null, accessVersion: 4, createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-10T10:00:00.000Z' },
  { id: '00000000-0000-4000-8000-000000000102', institutionId: '00000000-0000-4000-8000-000000000001', email: 'luis@example.test', displayName: 'Luis Pérez', role: 'ti_agente', active: false, teamId: '00000000-0000-4000-8000-000000000201', team: { id: '00000000-0000-4000-8000-000000000201', code: 'TI-MESA', name: 'Mesa de Ayuda' }, accessVersion: 2, createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-10T10:00:00.000Z' },
];
const teams = [{ id: '00000000-0000-4000-8000-000000000201', code: 'TI-MESA', name: 'Mesa de Ayuda' }];
async function fixture(page, role = 'administrador') {
  const state = { rows: structuredClone(initialUsers), requests: [], queries: [], updates: [], conflict: false, lastAdmin: false, holdSave: false };
  const user = { id: '00000000-0000-4000-8000-000000000099', institutionId: '00000000-0000-4000-8000-000000000001', email: 'admin@example.test', displayName: 'Admin Campus', role, active: true, teamId: null, permissions: role === 'administrador' ? ['users:manage'] : [] };
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.split('/api/v1/')[1];
    state.requests.push(endpoint);
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (endpoint === 'auth/me') return json({ user, csrfToken: 'csrf-fixture' });
    if (endpoint === 'users/teams') return json(teams);
    if (endpoint === 'users') {
      const query = Object.fromEntries(url.searchParams); state.queries.push(query);
      const rows = state.rows.filter(u => (!query.role || u.role === query.role) && (!query.active || String(u.active) === query.active) && (!query.teamId || u.teamId === query.teamId) && (!query.search || `${u.displayName} ${u.email}`.toLowerCase().includes(query.search.toLowerCase())));
      return json({ items: rows, total: rows.length, page: Number(query.page || 1), pageSize: Number(query.pageSize || 10) });
    }
    if (/^users\/.+\/access$/.test(endpoint)) {
      expect(route.request().headers()['x-csrf-token']).toBe('csrf-fixture');
      const id = endpoint.split('/')[1];
      if (state.conflict) return json({ code: 'CONFLICT', message: 'El acceso cambió. Actualiza antes de continuar.' }, 409);
      if (state.lastAdmin) return json({ code: 'LAST_ADMINISTRATOR', message: 'Debe permanecer al menos un administrador activo.' }, 409);
      if (state.holdSave) await new Promise(resolve => { state.releaseSave = resolve; });
      const body = route.request().postDataJSON(); state.updates.push({ id, body });
      const index = state.rows.findIndex(item => item.id === id);
      state.rows[index] = { ...state.rows[index], role: body.role, active: body.active, teamId: body.teamId, team: teams.find(t => t.id === body.teamId) || null, accessVersion: state.rows[index].accessVersion + 1 };
      return json(state.rows[index]);
    }
    if (/^users\/.+$/.test(endpoint)) return json(state.rows.find(item => item.id === endpoint.split('/')[1]));
    return json({ message: 'Ruta no contemplada en fixture.' }, 404);
  });
  return state;
}
const editor = page => page.getByRole('dialog', { name: 'Editar acceso de usuario', exact: true });
async function openEditor(page) {
  await page.goto('/admin/usuarios');
  await expect(page.getByRole('heading', { name: 'Usuarios y roles' })).toBeVisible();
  await page.getByRole('button', { name: 'Editar', exact: true }).first().click();
  await expect(editor(page).getByRole('heading', { name: 'Ana Torres' })).toBeVisible();
}
async function screenshot(page, name) {
  if (!process.env.USERS_SCREENSHOTS_DIR) return;
  fs.mkdirSync(process.env.USERS_SCREENSHOTS_DIR, { recursive: true });
  await page.screenshot({ path: path.join(process.env.USERS_SCREENSHOTS_DIR, name), fullPage: true });
}

test('lista y filtra sin cargar un perfil inexistente; edita tarjetas y switch con versión y CSRF', async ({ page }) => {
  const state = await fixture(page);
  await page.goto('/admin/usuarios');
  await expect(page.getByText('Ana Torres')).toBeVisible();
  await expect(page.getByText('Cargando perfil…')).toHaveCount(0);
  await screenshot(page, 'usuarios-listado.png');
  await page.getByRole('combobox', { name: 'Filtrar por rol' }).selectOption('docente');
  await expect(page.getByText('Luis Pérez')).toHaveCount(0);
  expect(state.queries.at(-1).role).toBe('docente');
  const editButton = page.getByRole('button', { name: 'Editar', exact: true }).first();
  await editButton.click();
  const dialog = editor(page);
  await expect(dialog.getByRole('heading', { name: 'Ana Torres' })).toBeVisible();
  await expect(dialog.getByRole('combobox')).toHaveCount(0);
  await expect(dialog.getByRole('radio', { name: 'Profesor', exact: true })).toBeChecked();
  await screenshot(page, 'usuarios-modal-escritorio.png');
  await dialog.getByRole('radio', { name: 'Administrador', exact: true }).check();
  await expect(dialog.getByRole('radio', { name: 'Profesor', exact: true })).not.toBeChecked();
  await dialog.getByRole('radio', { name: 'Mesa de Ayuda', exact: true }).check();
  await dialog.getByRole('switch', { name: 'Acceso activo' }).uncheck();
  await dialog.getByLabel('Motivo del cambio').fill('Asignación administrativa de prueba.');
  await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('status')).toContainText('Cambios guardados correctamente');
  expect(state.updates).toHaveLength(1);
  expect(state.updates[0].body).toEqual({ role: 'administrador', active: false, teamId: teams[0].id, reason: 'Asignación administrativa de prueba.', expectedVersion: 4 });
});

test('conflicto de versión permite recargar el perfil antes de editar de nuevo', async ({ page }) => {
  const state = await fixture(page); state.conflict = true;
  await openEditor(page);
  const dialog = editor(page);
  await dialog.getByRole('radio', { name: 'Administrador', exact: true }).check();
  await dialog.getByLabel('Motivo del cambio').fill('Cambio concurrente de prueba.');
  await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(dialog.getByRole('alert')).toContainText('El acceso cambió');
  state.rows[0].role = 'estudiante'; state.rows[0].accessVersion++;
  await dialog.getByRole('button', { name: 'Recargar perfil' }).click();
  await expect(dialog.getByRole('radio', { name: 'Estudiante', exact: true })).toBeChecked();
  await expect(dialog.getByLabel('Motivo del cambio')).toHaveValue('');
  await expect(dialog.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
});

test('oculta la ruta a quien no tiene users:manage', async ({ page }) => {
  const state = await fixture(page, 'estudiante');
  await page.goto('/admin/usuarios');
  await expect(page.getByRole('alert')).toContainText('No tienes permiso');
  expect(state.requests).not.toContain('users');
});

test('Escape cierra un modal sin cambios y devuelve el foco al botón de origen', async ({ page }) => {
  await fixture(page); await openEditor(page);
  await expect(editor(page).getByRole('button', { name: 'Cerrar ventana' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(editor(page)).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Editar', exact: true }).first()).toBeFocused();
});

test('protege cambios sin guardar al cerrar con Escape', async ({ page }) => {
  const state = await fixture(page); await openEditor(page);
  await editor(page).getByRole('radio', { name: 'Estudiante', exact: true }).check();
  await page.keyboard.press('Escape');
  const confirm = page.getByRole('dialog', { name: 'Descartar cambios sin guardar', exact: true });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(editor(page).getByRole('radio', { name: 'Estudiante', exact: true })).toBeChecked();
  await page.keyboard.press('Escape');
  await confirm.getByRole('button', { name: 'Descartar cambios', exact: true }).click();
  await expect(editor(page)).not.toBeVisible();
  expect(state.updates).toHaveLength(0);
});

test('no cierra ni permite un segundo guardado mientras la solicitud está pendiente', async ({ page }) => {
  const state = await fixture(page); state.holdSave = true; await openEditor(page);
  const dialog = editor(page);
  await dialog.getByRole('radio', { name: 'Estudiante', exact: true }).check();
  await dialog.getByLabel('Motivo del cambio').fill('Cambio de acceso pendiente de respuesta.');
  await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(dialog.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: 'Cerrar ventana' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect.poll(() => typeof state.releaseSave).toBe('function');
  state.releaseSave();
  await expect(dialog).not.toBeVisible();
  expect(state.updates).toHaveLength(1);
});

test('mantiene el modal y muestra la protección del último administrador', async ({ page }) => {
  const state = await fixture(page); state.rows[0].role = 'administrador'; state.lastAdmin = true; await openEditor(page);
  const dialog = editor(page);
  await dialog.getByRole('radio', { name: 'Estudiante', exact: true }).check();
  await dialog.getByLabel('Motivo del cambio').fill('Cambio de rol de administrador.');
  await dialog.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Debe permanecer un administrador activo');
  await expect(dialog).toBeVisible();
});

test('modal móvil sin desbordamiento y tarjetas accesibles con teclado', async ({ page }) => {
  await fixture(page); await page.setViewportSize({ width: 390, height: 844 }); await openEditor(page);
  const dialog = editor(page);
  const teacher = dialog.getByRole('radio', { name: 'Profesor', exact: true });
  await teacher.focus(); await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('radio', { name: 'Administrador', exact: true })).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await screenshot(page, 'usuarios-modal-movil.png');
});
