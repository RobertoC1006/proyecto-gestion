const { test, expect } = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

test.beforeEach(async ({ page }) => require('./notifications-fixture.cjs')(page));
const shots = path.resolve(process.env.TICKET_VISUAL_SHOTS || '../../.local/verification/johan');
fs.mkdirSync(shots, { recursive: true });
const id = '33333333-3333-4333-8333-333333333333';
const ticket = {
  id, code: 'INC-2026-FIXTURE-P07', description: 'Moodle no abre para el curso de prueba.',
  service: 'aula_virtual', reportedService: 'aula_virtual', scope: 'curso',
  courseId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', sectionId: null,
  courseName: 'Curso de prueba', ownerName: 'Titular ficticio',
  status: 'registrado', classificationStatus: 'ia', priority: 'P2',
  urgency: 3, impact: 2, academicFactor: 1, technicalScore: 6, score: 6,
  academicContext: { factor: 1, reason: 'Actividad regular', event: null, evaluatedAt: '2026-11-25T15:00:00Z' },
  aiExplanation: 'Acceso al aula virtual bloqueado.', version: 2, isDemo: true,
  assigneeId: null, assigneeName: null, responseDueAt: '2026-11-25T16:00:00Z',
  resolutionDueAt: '2026-11-26T15:00:00Z', firstResponseAt: null, resolvedAt: null,
  createdAt: '2026-11-25T15:00:00Z', updatedAt: '2026-11-25T15:01:00Z', changes: [],
};
const json = (route, data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });

test('P07–P08 muestran cola, propuesta revisable y atención con permisos en escritorio y móvil', async ({ page }) => {
  await page.route('**/api/**', route => route.abort('blockedbyclient'));
  await page.route('**/api/v1/auth/me', route => json(route, {
    user: { id: '11111111-1111-4111-8111-111111111111', institutionId: '22222222-2222-4222-8222-222222222222',
      email: 'fixture@example.test', displayName: 'Operador de prueba', role: 'administrador', active: true,
      permissions: ['tickets:read:institution', 'tickets:work:institution', 'users:manage'] }, csrfToken: 'fixture-csrf',
  }));
  await page.route('**/api/v1/operations/tickets?*', route => json(route, {
    items: [ticket], total: 1, page: 1, pageSize: 20,
    summary: [{ status: 'registrado', _count: 1 }, { status: 'en_atencion', _count: 0 }, { status: 'resuelto', _count: 0 }],
  }));
  await page.route(`**/api/v1/operations/tickets/${id}`, route => json(route, ticket));
  await page.route('**/api/v1/operations/services', route => json(route, [{ id: 'aula_virtual', label: 'Aula virtual' }, { id: 'correo', label: 'Correo institucional' }]));
  await page.route('**/api/v1/users?*', route => json(route, { items: [{ id: '44444444-4444-4444-8444-444444444444', displayName: 'Técnico ficticio' }] }));

  await page.goto('/ti/cola');
  await expect(page.getByRole('heading', { name: 'Cola de atención de TI' })).toBeVisible();
  await expect(page.getByText(ticket.code)).toBeVisible();
  await page.screenshot({ path: path.join(shots, 'p07-desktop-fixture.png'), fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.sidebar')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: path.join(shots, 'p07-mobile-fixture.png'), fullPage: true, animations: 'disabled' });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/ti/tickets/${id}`);
  await expect(page.getByText('Propuesta por IA')).toBeVisible();
  await expect(page.getByText(/Servicio declarado: Aula virtual/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar evaluación y prioridad' })).toBeDisabled();
  await page.getByRole('textbox', { name: /Motivo o avance/ }).fill('Revisión técnica de prueba.');
  await expect(page.getByRole('button', { name: 'Guardar evaluación y prioridad' })).toBeEnabled();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.screenshot({ path: path.join(shots, 'p08-desktop-fixture.png'), animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.sidebar')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(shots, 'p08-mobile-fixture.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Guardar evaluación y prioridad' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(shots, 'p08-mobile-actions-fixture.png'), animations: 'disabled' });
});
