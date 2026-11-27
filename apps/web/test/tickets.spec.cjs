const { test, expect } = require('@playwright/test');
test.beforeEach(async ({ page }) => require('./notifications-fixture.cjs')(page));
const path = require('node:path');
const fs = require('node:fs');
const shots = process.env.TICKET_VISUAL_SHOTS
  ? path.resolve(process.env.TICKET_VISUAL_SHOTS)
  : fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'campusitsm-tickets-'));
fs.mkdirSync(shots, { recursive: true });
test.afterAll(() => { if (!process.env.TICKET_VISUAL_SHOTS) fs.rmSync(shots, { recursive: true, force: true }); });
async function mobileCapture(page, filename) {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.sidebar')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: path.join(shots, filename), fullPage: true, animations: 'disabled' });
}
if (process.env.PLAYWRIGHT_CHROME_PATH) test.use({ launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROME_PATH } });

const user = { id: '11111111-1111-4111-8111-111111111111', institutionId: '22222222-2222-4222-8222-222222222222',
  email: 'fixture@example.test', displayName: 'Estudiante de prueba', role: 'estudiante', teamId: null,
  active: true, permissions: ['tickets:create', 'tickets:read:self', 'academic:read:self'] };
const id = '33333333-3333-4333-8333-333333333333';
const ticket = { id, code: 'INC-2026-ABCDEF123456ABCDEF123456', description: 'El correo institucional no funciona desde esta mañana.',
  service: 'correo', scope: 'general', courseId: null, sectionId: null, status: 'registrado',
  classificationStatus: 'pendiente', priority: null, createdAt: '2026-11-08T15:00:00.000Z', updatedAt: '2026-11-08T15:00:00.000Z' };
const json = (route, data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
async function fixture(page, onCreate = async route => json(route, ticket, 201)) {
  // Unhandled API calls must never reach shared infrastructure.
  await page.route('**/api/**', route => route.abort('blockedbyclient'));
  await page.route('**/api/v1/auth/me', route => json(route, { user, csrfToken: 'fixture-csrf' }));
  await page.route('**/api/v1/academic/me/events?*', route => json(route, { items: [], total: 0, page: 1, pageSize: 100 }));
  await page.route('**/api/v1/academic/me/context?*', route => json(route, {factor:1,reason:'Actividad regular',event:null,evaluatedAt:ticket.createdAt}));
  await page.route('**/api/v1/academic/me/courses?*', route => json(route, { items: [], total: 0, page: 1, pageSize: 100 }));
  await page.route('**/api/v1/academic/me/sections?*', route => json(route, { items: [], total: 0, page: 1, pageSize: 100 }));
  await page.route('**/api/v1/tickets**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/services')) return json(route, [{ id: 'correo', label: 'Correo institucional' }]);
    if (url.pathname === '/api/v1/tickets' && route.request().method() === 'POST') return onCreate(route);
    if (url.pathname === '/api/v1/tickets/summary') return json(route, { total: 1, registered: 1, inAttention: 0, resolved: 0 });
    if (url.pathname === '/api/v1/tickets') {
      const items = url.searchParams.get('status') === 'resuelto' ? [] : [ticket];
      return json(route, { items, total: items.length, page: 1, pageSize: 20 });
    }
    if (url.pathname.endsWith(`/${id}`)) return json(route, ticket);
    return json(route, { code: 'NOT_FOUND', message: 'No se encontró el ticket.' }, 404);
  });
}

test('General no consulta cursos y envía los campos académicos nulos', async ({ page }) => {
  let courseLookups = 0;
  let body;
  await fixture(page, async route => { body = route.request().postDataJSON(); return json(route, ticket, 201); });
  await page.route('**/api/v1/academic/me/courses?*', route => { courseLookups++; return json(route, { items: [], total: 0, page: 1, pageSize: 100 }); });
  await page.goto('/incidencias/nueva');
  await page.getByRole('textbox', { name: /Descripción del problema/ }).fill(ticket.description);
  await page.getByRole('combobox', { name: /Servicio afectado/ }).selectOption('correo');
  await page.screenshot({ path: path.join(shots, 'p03-desktop-fixture.png'), fullPage: true });
  await mobileCapture(page, 'p03-mobile-fixture.png');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Enviar incidencia' }).click();
  await expect(page).toHaveURL(new RegExp(`/incidencias/registrada/${id}$`));
  expect(courseLookups).toBe(0);
  expect(body).toMatchObject({ scope: 'general', courseId: null, sectionId: null });
  expect(Object.keys(body).sort()).toEqual(['courseId', 'description', 'scope', 'sectionId', 'service']);
});

test('Curso usa asociaciones propias y limpia la sección al cambiar de curso', async ({ page }) => {
  const courseA = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', code: 'C1', name: 'Curso uno' };
  const courseB = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', code: 'C2', name: 'Curso dos' };
  const sectionA = { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', courseId: courseA.id, code: 'A', name: 'Sección A' };
  const sectionB = { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', courseId: courseB.id, code: 'B', name: 'Sección B' };
  let body;
  await fixture(page, async route => { body = route.request().postDataJSON(); return json(route, ticket, 201); });
  await page.route('**/api/v1/academic/me/courses?*', route => json(route, { items: [courseA, courseB], total: 2, page: 1, pageSize: 100 }));
  await page.route('**/api/v1/academic/me/sections?*', route => {
    const url = new URL(route.request().url());
    const items = url.searchParams.get('courseId') === courseA.id ? [sectionA] : [sectionB];
    return json(route, { items, total: items.length, page: 1, pageSize: 100 });
  });
  await page.goto('/incidencias/nueva');
  await page.getByRole('textbox', { name: /Descripción del problema/ }).fill(ticket.description);
  await page.getByRole('combobox', { name: /Servicio afectado/ }).selectOption('correo');
  await page.getByRole('button', { name: /Un curso o actividad/ }).click();
  const course = page.getByRole('combobox', { name: 'Curso' });
  await expect(course.locator('option')).toHaveCount(3);
  await course.selectOption(courseA.id);
  const section = page.getByRole('combobox', { name: 'Sección' });
  await section.selectOption(sectionA.id);
  await course.selectOption(courseB.id);
  await expect(section).toHaveValue('');
  await expect(section.locator('option')).toContainText(['Sin sección específica', 'B · Sección B']);
  await page.getByRole('button', { name: 'Enviar incidencia' }).click();
  await expect(page).toHaveURL(new RegExp(`/incidencias/registrada/${id}$`));
  expect(body).toMatchObject({ scope: 'curso', courseId: courseB.id, sectionId: null });
});

test('P02–P05 muestran un ticket real, sin prioridad ni clasificación inventadas', async ({ page }) => {
  let calls = 0;
  await fixture(page, route => {
    calls++;
    expect(route.request().headers()['x-csrf-token']).toBe('fixture-csrf');
    expect(route.request().headers()['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/);
    return json(route, ticket, 201);
  });
  await page.goto('/incidencias/nueva');
  await page.getByRole('textbox', { name: /Descripción del problema/ }).fill(ticket.description);
  await page.getByRole('combobox', { name: /Servicio afectado/ }).selectOption('correo');
  await page.getByRole('button', { name: 'Enviar incidencia' }).click();
  await expect(page).toHaveURL(new RegExp(`/incidencias/registrada/${id}$`));
  await expect(page.getByText(`Ticket: ${ticket.code}`)).toBeVisible();
  await expect(page.getByText('Evaluación', { exact: true })).toBeVisible();
  await expect(page.getByText('Clasificación pendiente', { exact: true })).toBeVisible();
  await expect(page.getByText('Aún no calculada')).toBeVisible();
  await page.screenshot({ path: path.join(shots, 'p04-desktop.png'), fullPage: true });
  await mobileCapture(page, 'p04-mobile-fixture.png');
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(calls).toBe(1);
  await page.goto('/incidencias');
  await expect(page.getByText(ticket.code)).toBeVisible();
  const filters = [
    { name: 'Activas (1)', status: 'active' },
    { name: 'Resueltas (0)', status: 'resuelto' },
    { name: 'Todas (1)', status: null },
  ];
  await expect(page.getByRole('button', { name: 'Todas (1)', exact: true })).toHaveAttribute('aria-pressed', 'true');
  for (const filter of filters) {
    const filtered = page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.pathname === '/api/v1/tickets' && url.searchParams.get('status') === filter.status;
    });
    await page.getByRole('button', { name: filter.name, exact: true }).click();
    const response = await filtered;
    expect(new URL(response.url()).searchParams.get('status')).toBe(filter.status);
    expect((await response.json()).items).toEqual(filter.status === 'resuelto' ? [] : [ticket]);
    for (const button of filters) {
      await expect(page.getByRole('button', { name: button.name, exact: true })).toHaveAttribute('aria-pressed', String(button === filter));
    }
    if (filter.status === 'resuelto') {
      await expect(page.getByText(ticket.code)).toHaveCount(0);
      await expect(page.getByText('Sin incidencias en este filtro', { exact: true })).toBeVisible();
    } else {
      await expect(page.getByText(ticket.code)).toBeVisible();
      await expect(page.getByText('Sin incidencias en este filtro', { exact: true })).toHaveCount(0);
    }
  }
  await page.screenshot({ path: path.join(shots, 'p05-desktop.png'), fullPage: true });
  await mobileCapture(page, 'p05-mobile-fixture.png');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByText(ticket.code).click();
  await expect(page.getByRole('heading', { name: 'Seguimiento de incidencia' })).toBeVisible();
  await page.screenshot({ path: path.join(shots, 'ticket-detail-desktop-fixture.png'), fullPage: true });
  await mobileCapture(page, 'ticket-detail-mobile-fixture.png');
  await page.goto('/');
  await expect(page.getByText(ticket.code)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: path.join(shots, 'p02-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.screenshot({ path: path.join(shots, 'p02-desktop-fixture.png'), animations: 'disabled' });
});

test('P05 refreshes personal counts when another session resolves a ticket', async ({ page }) => {
  const now = new Date('2026-11-21T12:00:00Z');
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  // Query notifications use timers too; flush setup/rendering without waiting 15 seconds.
  const render = async locator => {
    await expect.poll(async () => {
      await page.clock.runFor(1);
      return locator.isVisible();
    }).toBe(true);
  };
  await fixture(page);
  let current = { ...ticket };
  let summaryCalls = 0;
  await page.route('**/api/v1/tickets**', route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/v1/tickets/summary') {
      summaryCalls++;
      const resolved = current.status === 'resuelto' ? 1 : 0;
      return json(route, { total: 1, registered: 1 - resolved, inAttention: 0, resolved });
    }
    if (url.pathname === '/api/v1/tickets') {
      const status = url.searchParams.get('status');
      const matches = !status || (status === 'active' ? current.status !== 'resuelto' : current.status === status);
      const items = matches ? [current] : [];
      return json(route, { items, total: items.length, page: 1, pageSize: 20 });
    }
    return route.fallback();
  });
  await page.goto('/incidencias');
  await render(page.getByRole('button', { name: 'Todas (1)', exact: true }));
  await expect(page.getByRole('button', { name: 'Todas (1)', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Activas (1)', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resueltas (0)', exact: true })).toBeVisible();
  const activeLoaded = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname === '/api/v1/tickets' && url.searchParams.get('status') === 'active';
  });
  await page.getByRole('button', { name: 'Activas (1)', exact: true }).click();
  expect((await (await activeLoaded).json()).items).toHaveLength(1);
  await render(page.getByText(ticket.code));
  await expect(page.getByText(ticket.code)).toBeVisible();
  const previousSummaryCalls = summaryCalls;
  current = { ...current, status: 'resuelto' };
  const polledList = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname === '/api/v1/tickets' && url.searchParams.get('status') === 'active';
  });
  await page.clock.runFor(15000);
  expect((await (await polledList).json()).items).toHaveLength(0);
  await render(page.getByText('Sin incidencias en este filtro', { exact: true }));
  await expect(page.getByText('Sin incidencias en este filtro', { exact: true })).toBeVisible();
  await render(page.getByRole('button', { name: 'Activas (0)', exact: true }));
  await expect(page.getByRole('button', { name: 'Activas (0)', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Resueltas (1)', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Todas (1)', exact: true })).toBeVisible();
  expect(summaryCalls).toBeGreaterThan(previousSummaryCalls);
});

test('un fallo de red conserva el formulario y la misma clave para reintentar', async ({ page }) => {
  const keys = [];
  await fixture(page, route => {
    keys.push(route.request().headers()['idempotency-key']);
    if (keys.length === 1) return route.abort('failed');
    return json(route, ticket, 200);
  });
  await page.goto('/incidencias/nueva');
  await page.getByRole('textbox', { name: /Descripción del problema/ }).fill(ticket.description);
  await page.getByRole('combobox', { name: /Servicio afectado/ }).selectOption('correo');
  await page.getByRole('button', { name: 'Enviar incidencia' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('textbox', { name: /Descripción del problema/ })).toHaveValue(ticket.description);
  await page.getByRole('button', { name: 'Enviar incidencia' }).click();
  await expect(page).toHaveURL(new RegExp(`/incidencias/registrada/${id}$`));
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
});
