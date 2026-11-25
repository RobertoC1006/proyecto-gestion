const { test, expect } = require('@playwright/test')

const userId = '00000000-0000-4000-8000-000000000101'
const institutionId = '00000000-0000-4000-8000-000000000102'

async function fixture(page, role) {
  const permissions = role === 'administrador'
    ? ['audit:read:institution', 'certificates:request:self']
    : ['certificates:request:self']
  const state = { auditQueries: [] }
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url())
    const endpoint = url.pathname.split('/api/v1/')[1]
    const json = body => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    if (endpoint === 'auth/me') return json({
      user: { id: userId, institutionId, email: 'fixture@example.test', displayName: 'Prueba auditoría', role, active: true, teamId: null, permissions },
      csrfToken: 'csrf-fixture',
    })
    if (endpoint === 'certificates/audit') {
      state.auditQueries.push(Object.fromEntries(url.searchParams))
      return json({
        items: [{
          id: '00000000-0000-4000-8000-000000000103',
          code: 'CITS-AAAAAAAAAAAAAAAAAAAA',
          certificateId: '00000000-0000-4000-8000-000000000104',
          ticketCode: 'INC-2026-TEST',
          actorId: userId,
          action: 'emitida',
          occurredAt: '2026-11-20T15:00:00.000Z',
        }],
        total: 1,
        page: 1,
        pageSize: 20,
      })
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Not found' }) })
  })
  return state
}

test('Auditoría de constancias aplica permisos y filtros del servidor', async ({ page }) => {
  const state = await fixture(page, 'administrador')
  await page.goto('/admin/constancias/auditoria')
  await expect(page.getByRole('heading', { name: 'Auditoría de constancias' })).toBeVisible()
  await expect(page.getByText('CITS-AAAAAAAAAAAAAAAAAAAA')).toBeVisible()
  await expect(page.getByText('INC-2026-TEST')).toBeVisible()

  await page.getByLabel('Código de constancia').fill('CITS-AAAAAAAAAAAAAAAAAAAA')
  await page.getByLabel('ID del actor').fill(userId)
  await page.getByLabel('Acción').selectOption('emitida')
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect.poll(() => state.auditQueries.length).toBeGreaterThan(1)
  expect(state.auditQueries.at(-1)).toMatchObject({
    code: 'CITS-AAAAAAAAAAAAAAAAAAAA',
    actorId: userId,
    action: 'emitida',
  })
})

test('Un usuario sin permiso no consulta ni ve la auditoría', async ({ page }) => {
  const state = await fixture(page, 'estudiante')
  await page.goto('/admin/constancias/auditoria')
  await expect(page.getByRole('alert')).toContainText('No tienes permiso')
  expect(state.auditQueries).toHaveLength(0)
})
