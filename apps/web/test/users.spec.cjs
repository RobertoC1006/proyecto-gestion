const { test, expect } = require('@playwright/test');

const users = [
  { id: '00000000-0000-4000-8000-000000000101', institutionId: '00000000-0000-4000-8000-000000000001', email: 'ana@example.test', displayName: 'Ana Torres', role: 'docente', active: true, teamId: null, team: null, accessVersion: 4, createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-10T10:00:00.000Z' },
  { id: '00000000-0000-4000-8000-000000000102', institutionId: '00000000-0000-4000-8000-000000000001', email: 'luis@example.test', displayName: 'Luis Pérez', role: 'ti_agente', active: false, teamId: '00000000-0000-4000-8000-000000000201', team: { id: '00000000-0000-4000-8000-000000000201', code: 'TI-MESA', name: 'Mesa de Ayuda' }, accessVersion: 2, createdAt: '2026-11-01T10:00:00.000Z', updatedAt: '2026-11-10T10:00:00.000Z' },
];
const teams = [{ id: '00000000-0000-4000-8000-000000000201', code: 'TI-MESA', name: 'Mesa de Ayuda' }];

async function fixture(page, role = 'administrador') {
  const state = { requests: [], updates: [], conflict: false };
  const user = { id: '00000000-0000-4000-8000-000000000099', institutionId: '00000000-0000-4000-8000-000000000001', email: 'admin@example.test', displayName: 'Admin Campus', role, active: true, teamId: null, permissions: role === 'administrador' ? ['users:manage'] : [] };
  await page.route('**/api/v1/**', async route => {
    const endpoint = new URL(route.request().url()).pathname.split('/api/v1/')[1];
    state.requests.push(endpoint);
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (endpoint === 'auth/me') return json({ user, csrfToken: 'csrf-fixture' });
    if (endpoint === 'users/teams') return json(teams);
    if (endpoint === 'users') return json({ items: users, total: users.length, page: 1, pageSize: 10 });
    if (/^users\/.+\/access$/.test(endpoint)) {
      const id = endpoint.split('/')[1];
      if (state.conflict) return json({ code: 'CONFLICT', message: 'El acceso cambió. Actualiza antes de continuar.' }, 409);
      const body = route.request().postDataJSON(); state.updates.push({ id, body });
      return json({ ...users.find(item => item.id === id), ...body, team: body.teamId ? teams[0] : null, accessVersion: users.find(item => item.id === id).accessVersion + 1 });
    }
    if (/^users\/.+$/.test(endpoint)) return json(users.find(item => item.id === endpoint.split('/')[1]));
    return json({ message: 'Ruta no contemplada en fixture.' }, 404);
  });
  return state;
}

test('lista, filtra y edita el acceso usando la versión del usuario', async ({ page }) => {
  const state = await fixture(page);
  await page.goto('/admin/usuarios');
  await expect(page.getByRole('heading', { name: 'Usuarios y roles' })).toBeVisible();
  await expect(page.getByText('Ana Torres')).toBeVisible();
  await page.getByRole('combobox', { name: 'Filtrar por rol' }).selectOption('docente');
  const editButton = page.getByRole('button', { name: 'Editar' }).first();
  await editButton.click();
  await expect(page.getByRole('heading', { name: 'Ana Torres' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerrar edición' })).toBeFocused();
  await page.getByLabel('Rol *').selectOption('administrador');
  await page.getByLabel('Motivo del cambio').fill('Asignación administrativa de prueba.');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Cambios guardados correctamente' })).toBeVisible();
  await expect(editButton).toBeFocused();
  expect(state.updates[0].body.expectedVersion).toBe(4);
  expect(state.updates[0].body.role).toBe('administrador');
});

test('muestra el conflicto de versión sin ocultar el panel', async ({ page }) => {
  const state = await fixture(page); state.conflict = true;
  await page.goto('/admin/usuarios');
  await page.getByRole('button', { name: 'Editar' }).first().click();
  await page.getByLabel('Motivo del cambio').fill('Cambio concurrente de prueba.');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('alert')).toContainText('El acceso cambió');
  await expect(page.getByRole('heading', { name: 'Ana Torres' })).toBeVisible();
});

test('oculta la ruta a quien no tiene users:manage', async ({ page }) => {
  const state = await fixture(page, 'estudiante');
  await page.goto('/admin/usuarios');
  await expect(page.getByRole('alert')).toContainText('No tienes permiso');
  expect(state.requests).not.toContain('users');
});

test('cierra el panel con Escape y restaura el foco al botón que lo abrió', async ({ page }) => {
  await fixture(page);
  await page.goto('/admin/usuarios');
  const editButton = page.getByRole('button', { name: 'Editar' }).first();
  await editButton.click();
  await expect(page.getByRole('button', { name: 'Cerrar edición' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Ana Torres' })).not.toBeVisible();
  await expect(editButton).toBeFocused();
});