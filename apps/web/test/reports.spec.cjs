const { test, expect } = require('@playwright/test');
test.beforeEach(async ({ page }) => require('./notifications-fixture.cjs')(page));

for (const synthetic of [false, true]) {
  test(`P15 renders selected origin: ${synthetic}`, async ({ page }) => {
    const user = { id: '11111111-1111-4111-8111-111111111111', institutionId: '22222222-2222-4222-8222-222222222222',
      email: 'fixture@example.test', displayName: 'Report fixture', role: 'administrador', active: true,
      teamId: null, permissions: ['reports:read:institution'] };
    await page.route('**/api/**', route => route.abort());
    const json = (route, data) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
    await page.route('**/api/v1/auth/me', route => json(route, { user, csrfToken: 'fixture' }));
    await page.route('**/api/v1/reports?*', route => json(route, {
      series: [{ period: '2026-11-01', observed: 1, forecast: null }],
      categories: [{ service: 'correo', label: 'Correo institucional', count: 1, percentage: 100 }],
      total: 1, registered: 1, inAttention: 0, resolved: 0, resolutionRate: 0, resolvedWithinSlaRate: null,
      source: 'tickets-operational', synthetic, forecastStatus: 'unavailable', forecastMessage: 'Sin servicio de pronóstico.',
      filters: { from: '2026-11-01', to: '2026-11-20', period: 'week', scope: 'institution' },
    }));
    await page.goto('/reportes');
    await expect(page.getByRole('heading', { name: 'Histórico y resultados' })).toBeVisible();
    await expect(page.getByText(synthetic ? 'Incluye tickets de demostración: Sí.' : 'Incluye tickets de demostración: No.', { exact: false })).toBeVisible();
    await expect(page.getByText('Pronóstico no disponible.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exportar reporte' })).toBeEnabled();
    const requests = [];
    await page.route('**/api/v1/reports/export?*', route => { requests.push(new URL(route.request().url()).searchParams); return route.fulfill({status:500}); });
    await page.getByLabel('Desde').fill('2026-11-20');
    await page.getByLabel('Hasta').fill('2026-11-24');
    await page.route('**/api/v1/reports?*', route => {
      requests.push(new URL(route.request().url()).searchParams);
      return json(route, {series:[],categories:[],total:0,registered:0,inAttention:0,resolved:0,synthetic,forecastStatus:'unavailable',forecastMessage:'Sin servicio de pronóstico.',filters:{}});
    });
    await page.getByRole('button', {name:'Aplicar filtros'}).click();
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    await page.getByRole('button', {name:'Exportar reporte'}).click();
    await expect(page.getByRole('alert')).toContainText('No se pudo exportar el reporte.');
    expect(Object.fromEntries(requests.at(-1))).toEqual(Object.fromEntries(requests.at(-2)));
    expect(requests.at(-1).get('from')).toBe('2026-11-20T05:00:00.000Z');
    expect(requests.at(-1).get('to')).toBe('2026-11-25T04:59:59.999Z');
  });
}
