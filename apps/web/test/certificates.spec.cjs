const { test, expect } = require('@playwright/test');
const code = 'CITS-' + 'A'.repeat(20);
const other = 'CITS-' + 'B'.repeat(20);
const result = { code, holder: 'Y***', service: 'Equipo de cómputo', resolvedAt: '2026-11-20T10:00:00Z', issuedAt: '2026-11-20T11:00:00Z', status: 'valida' };
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
async function fixture(page) {
  await page.route('**/api/**', route => route.abort('blockedbyclient'));
  await page.route('**/api/v1/auth/me', route => json(route, { code: 'SESSION_REQUIRED' }, 401));
  await page.route('**/api/v1/certificates/public/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname === `/api/v1/certificates/public/${code}`) return json(route, result);
    return json(route, { code: 'CERTIFICATE_NOT_FOUND', message: 'No existe una constancia para el código indicado.' }, 404);
  });
}

test('QR directo consulta el código y solo muestra el resultado público mínimo', async ({ page }) => {
  await fixture(page);
  await page.goto(`/verificar/${code}`);
  await expect(page.getByRole('heading', { name: 'Constancia encontrada', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /^Código de constancia/ })).toHaveValue(code);
  await expect(page.getByText('El código corresponde a una constancia emitida para Y***.')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Servicio: Equipo de cómputo.');
  await expect(page.getByRole('heading', { name: 'Constancia válida e íntegra' })).toHaveCount(0);
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(/Yasmin Zeta|fixture@example.test|INC-2026|SHA-256/);
});

test('Formulario cambia de código inexistente a válido y conserva el error público mínimo', async ({ page }) => {
  await fixture(page);
  await page.goto(`/verificar/${other}`);
  await expect(page.getByRole('heading', { name: 'Constancia inexistente' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText('No existe una constancia para el código indicado.');
  await expect(page.getByLabel('Comprobar integridad de un PDF')).toHaveCount(0);
  await page.getByRole('textbox', { name: /^Código de constancia/ }).fill(` ${code} `);
  await page.getByRole('button', { name: 'Consultar código' }).click();
  await expect(page).toHaveURL(new RegExp(`/verificar/${code}$`));
  await expect(page.getByRole('heading', { name: 'Constancia encontrada' })).toBeVisible();
});

test('Comprobar bytes distingue original, alteración y archivo no verificable', async ({ page }) => {
  await fixture(page);
  const original = Buffer.from('%PDF-original de prueba');
  await page.route(`**/api/v1/certificates/public/${code}/verify`, route => {
    const matches = route.request().postDataBuffer().includes(original);
    return json(route, { code, status: matches ? 'valida' : 'alterado', sha256Matches: matches });
  });
  await page.goto(`/verificar/${code}`);
  const file = page.getByLabel('Comprobar integridad de un PDF');
  await file.setInputFiles({ name: 'original.pdf', mimeType: 'application/pdf', buffer: original });
  await expect(page.getByRole('heading', { name: 'Constancia válida e íntegra' })).toBeVisible();
  await file.setInputFiles({ name: 'alterado.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-alterado') });
  await expect(page.getByRole('heading', { name: 'Documento alterado' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'El archivo presentado no coincide' })).toBeVisible();
  await file.setInputFiles({ name: 'texto.txt', mimeType: 'text/plain', buffer: Buffer.from('no PDF') });
  await expect(page.getByRole('status').filter({ hasText: 'Selecciona un archivo PDF.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Constancia válida e íntegra' })).toHaveCount(0);
});

test('La ruta privada conserva el cierre de acceso para visitantes anónimos', async ({ page }) => {
  await fixture(page);
  await page.goto('/constancias');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Mis constancias' })).toHaveCount(0);
});
