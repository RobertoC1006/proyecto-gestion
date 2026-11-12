const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const screenshots = path.resolve(__dirname, '../../../docs/entregas/capturas/calendario');
const institutionId = '00000000-0000-4000-8000-000000000001';
const course = { id: '00000000-0000-4000-8000-000000000011', institutionId, code: 'RED', name: 'Redes I', createdAt: '2026-11-01T00:00:00.000Z' };
const section = { ...course, id: '00000000-0000-4000-8000-000000000021', courseId: course.id, code: 'A', name: 'Sección A' };
const first = { id: '00000000-0000-4000-8000-000000000031', institutionId, title: 'Redes I · Parcial', type: 'examen', scope: 'section', courseId: course.id, sectionId: section.id, source: 'manual', startsAt: '2026-11-06T15:30:00.000Z', endsAt: '2026-11-06T17:00:00.000Z', version: 1, createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z', course, section };
const second = { ...first, id: '00000000-0000-4000-8000-000000000032', title: 'Redes I · Entrega', type: 'entrega', startsAt: '2026-11-06T19:00:00.000Z', endsAt: '2026-11-06T19:45:00.000Z' };
fs.mkdirSync(screenshots, { recursive: true });

async function fixtures(page, options = {}) {
  const state = { events: [{ ...first }, { ...second }], writes: [], ...options };
  await page.route('**/api/v1/auth/me', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ user: { id: '00000000-0000-4000-8000-000000000099', institutionId, displayName: 'Prueba visual', email: 'fixture@example.test', role: 'administrador', teamId: null, active: true, permissions: ['academic:manage'] }, csrfToken: 'csrf-fixture' }) }));
  // Datos únicamente de pruebas de interfaz. No se insertan en PostgreSQL ni se publican como sesión.
  await page.route('**/api/v1/academic/**', async route => {
    const req = route.request(), url = new URL(req.url()), endpoint = url.pathname.split('/academic/')[1];
    const method = req.method();
    const fulfill = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    const paged = items => ({ items, total: items.length, page: 1, pageSize: 100 });
    if (state.denied) return fulfill({ code: 'SESSION_REQUIRED', message: 'Necesitas una sesión válida para consultar el calendario.' }, 401);
    if (method === 'GET') {
      if (endpoint === 'courses') return fulfill(paged([course]));
      if (endpoint === 'sections') return fulfill(paged([section]));
      if (endpoint === 'events') return fulfill(paged(state.events.filter(e => (!url.searchParams.get('from') || e.endsAt > new Date(url.searchParams.get('from')).toISOString()) && (!url.searchParams.get('to') || e.startsAt < new Date(url.searchParams.get('to')).toISOString()))));
      if (endpoint.startsWith('events/')) return fulfill(state.events.find(e => e.id === endpoint.split('/')[1]) ?? {}, 200);
    }
    const body = req.postDataJSON(); state.writes.push({ endpoint, method, body });
    if (state.conflict) return fulfill({ code: 'CONFLICT', message: 'El registro cambió. Actualiza la información antes de continuar.' }, 409);
    if (method === 'DELETE') { state.events = state.events.filter(e => e.id !== endpoint.split('/')[1]); return fulfill({ id: first.id, deleted: true }); }
    if (endpoint === 'events' && method === 'POST') {
      const event = { ...first, ...body, id: '00000000-0000-4000-8000-000000000033' }; state.events.push(event); return fulfill(event, 201);
    }
    if (method === 'PATCH') { const event = { ...first, ...body, version: 2 }; state.events = state.events.map(e => e.id === event.id ? event : e); return fulfill(event); }
    return fulfill({ code: 'NOT_IMPLEMENTED' }, 404);
  });
  return state;
}
async function fillForm(page) {
  await page.getByLabel('Título del evento').fill('Redes I · Examen final');
  await page.locator('#event-courseId').selectOption(course.id);
  await page.locator('#event-sectionId').selectOption(section.id);
  await page.getByLabel('Fecha y hora de inicio').fill('2026-11-06T10:30');
  await page.getByLabel('Fecha y hora de fin').fill('2026-11-06T12:00');
  await page.getByLabel('Motivo del registro').fill('Programación de evaluación final.');
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
}
async function capture(page, filename) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  await page.screenshot({ path: path.join(screenshots, filename), fullPage: true });
}

test('P17: semana, detalle, filtros, navegación y captura de escritorio', async ({ page }) => {
  await fixtures(page);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/admin/calendario?date=2026-11-06');
  await page.getByRole('button', { name: /Redes I · Parcial,/ }).click();
  await expect(page.getByRole('heading', { name: 'Detalle del evento' })).toBeVisible();
  await expect(page.locator('.academic-event-detail')).toContainText('Usuarios asociados a la sección');
  await noOverflow(page);
  await capture(page, 'p17-casos-escritorio-fixture.png');
  await page.getByLabel('Carga manual').uncheck();
  await expect(page.getByRole('button', { name: /Redes I · Parcial,/ })).toHaveCount(0);
  await page.getByLabel('Carga manual').check();
  await page.getByRole('button', { name: 'Semana siguiente' }).click();
  await expect(page.getByText('No hay eventos en esta semana.', { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});
test('P18: error de fin anterior, vista previa y guardar UTC', async ({ page }) => {
  const state = await fixtures(page);
  await page.goto('/admin/calendario/nuevo'); await fillForm(page);
  await page.getByLabel('Fecha y hora de fin').fill('2026-11-06T09:00');
  await page.getByRole('button', { name: 'Validar y guardar' }).click();
  await expect(page.locator('#error-endsAt')).toHaveText('El fin debe ser posterior al inicio.');
  expect(state.writes).toHaveLength(0);
  await page.getByLabel('Fecha y hora de fin').fill('2026-11-06T12:00');
  await capture(page, 'p18-casos-escritorio-fixture.png');
  await noOverflow(page);
  await page.getByRole('button', { name: 'Validar y guardar' }).click();
  await expect(page).toHaveURL(/calendario\?date=2026-11-06/);
  expect(state.writes[0].body.startsAt).toBe('2026-11-06T15:30:00.000Z');
  expect(state.writes[0].body.sectionId).toBe(section.id);
});
test('Editar, manejar conflicto de versión y eliminar con motivo', async ({ page }) => {
  const state = await fixtures(page);
  await page.goto(`/admin/calendario/${first.id}/editar`);
  await expect(page.getByLabel('Título del evento')).toHaveValue(first.title);
  await page.getByLabel('Motivo del cambio').fill('Corrección de nombre del parcial.');
  state.conflict = true;
  await page.getByRole('button', { name: 'Validar y guardar' }).click();
  await expect(page.getByRole('alert')).toContainText('El registro cambió.');
  expect(state.writes[0].body.expectedVersion).toBe(1);
  state.conflict = false;
  await page.getByRole('button', { name: 'Validar y guardar' }).click();
  await expect(page).toHaveURL(/calendario\?date/);
  await page.getByRole('button', { name: /Redes I · Parcial,/ }).click();
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByLabel('Motivo de eliminación').fill('Evento cancelado por reprogramación.');
  await page.getByRole('button', { name: 'Eliminar evento', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Evento eliminado.');
  expect(state.writes.at(-1).body.expectedVersion).toBe(2);
});
test('Sin sesión: no revela eventos ni permite guardar', async ({ page }) => {
  let academicRequests = 0;
  await page.route('**/api/v1/auth/me', route => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 'SESSION_REQUIRED' }) }));
  await page.route('**/api/v1/academic/**', route => { academicRequests++; return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }); });
  await page.goto('/admin/calendario');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Ingresa a CampusITSM' })).toBeVisible();
  await expect(page.locator('.sidebar')).toHaveCount(0);
  await expect(page.locator('.calendar-event')).toHaveCount(0);
  await page.goto('/admin/calendario/nuevo');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Validar y guardar' })).toHaveCount(0);
  expect(academicRequests).toBe(0);
});
test('P17/P18 móvil 390 × 844: agenda sin desbordamiento y formulario', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixtures(page); await page.goto('/admin/calendario?date=2026-11-06');
  await page.getByRole('button', { name: '10:30 Redes I · Parcial Examen' }).click();
  await noOverflow(page);
  await capture(page, 'p17-casos-movil-fixture.png');
  await page.getByRole('link', { name: 'Nuevo evento' }).click(); await fillForm(page);
  await noOverflow(page);
  await capture(page, 'p18-casos-movil-fixture.png');
});

test('Menú móvil de la referencia: abre, navega, cierra y admite Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixtures(page);
  await page.goto('/admin/calendario/nuevo');
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
  await page.getByRole('link', { name: 'Calendario académico', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
});
