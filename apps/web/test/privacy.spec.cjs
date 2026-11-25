const { test, expect } = require('@playwright/test');
test.beforeEach(async ({ page }) => require('./notifications-fixture.cjs')(page));

const actorId = '11111111-1111-4111-8111-111111111111';
const user = {
  id: actorId, institutionId: '22222222-2222-4222-8222-222222222222',
  email: 'fixture@example.test', displayName: 'Usuario de prueba',
  role: 'estudiante', active: true, teamId: null, permissions: [],
};
const json = (route, body) => route.fulfill({ json: body });

test('El consentimiento está disponible al estudiante y auditoría exige su permiso', async ({ page }) => {
  let requests = 0;
  await page.route('**/api/**', route => route.abort());
  await page.route('**/api/v1/auth/me', route => json(route, { user, csrfToken: 'fixture' }));
  await page.route('**/api/v1/consent/me', route => json(route, {
    current: { id: actorId, version: '1', title: 'Política de prueba', summary: 'Política del escenario aislado.', effectiveAt: '2026-11-20T14:00:00Z' },
    acceptance: null,
  }));
  await page.route('**/api/v1/audit?*', route => { requests++; return route.abort(); });
  await page.goto('/admin/privacidad');
  await expect(page.getByRole('heading', { name: 'Privacidad y consentimiento' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacidad', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Auditoría', exact: true })).toHaveCount(0);
  const accept = page.getByRole('button', { name: 'Aceptar consentimiento' });
  await expect(accept).toBeDisabled();
  await page.getByRole('checkbox').check();
  await expect(accept).toBeEnabled();
  await page.goto('/admin/auditoria');
  await expect(page.getByRole('alert')).toContainText('No tienes permiso');
  expect(requests).toBe(0);
});

test('Auditoría conserva la hora local y exporta exactamente los filtros aplicados', async ({ page }) => {
  const requests = [];
  await page.route('**/api/**', route => route.abort());
  await page.route('**/api/v1/auth/me', route => json(route, {
    user: { ...user, role: 'administrador', permissions: ['audit:read:institution'] }, csrfToken: 'fixture',
  }));
  await page.route('**/api/v1/audit?*', route => {
    requests.push(new URL(route.request().url()).searchParams);
    return json(route, { items: [], total: 0, page: 1, pageSize: 10 });
  });
  await page.route('**/api/v1/audit/export?*', route => {
    requests.push(new URL(route.request().url()).searchParams);
    return route.fulfill({ status: 500 });
  });
  await page.goto('/admin/auditoria');
  await expect(page.getByRole('heading', { name: 'Auditoría institucional' })).toBeVisible();
  const from = page.getByLabel('Desde');
  const to = page.getByLabel('Hasta');
  await from.fill('2026-11-20T09:15');
  await to.fill('2026-11-20T12:30');
  await expect(from).toHaveValue('2026-11-20T09:15');
  await expect(to).toHaveValue('2026-11-20T12:30');
  await page.getByLabel('ID del actor').fill(actorId);
  await page.getByLabel('Objeto').selectOption('Ticket');
  await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
  await expect.poll(() => requests.at(-1)?.get('actorId')).toBe(actorId);
  await page.getByRole('button', { name: 'Exportar CSV autorizado' }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo exportar la auditoría.');
  const filters = { actorId, objectType: 'Ticket', from: '2026-11-20T14:15:00.000Z', to: '2026-11-20T17:30:00.000Z' };
  expect(Object.fromEntries(requests.at(-2))).toMatchObject(filters);
  expect(Object.fromEntries(requests.at(-1))).toEqual(filters);
});
