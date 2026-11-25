const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const { registerCertificateVerificationBodyParser } = require('../dist/certificates/certificates.upload');

test('La carga pública admite un PDF de 5 MiB y conserva el límite normal en otras rutas', async () => {
  const app = express();
  registerCertificateVerificationBodyParser(app);
  app.use(express.json());
  const size = (req, res) => res.json({ size: Buffer.from(req.body.pdfBase64, 'base64').length });
  app.post('/api/v1/certificates/public/:code/verify', size);
  app.post('/api/v1/other', size);
  app.use((error, _request, response, _next) => response.sendStatus(error.status || 500));
  const server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.once('error', reject);
  });
  try {
    const pdf = Buffer.alloc(5 * 1024 * 1024);
    pdf.write('%PDF');
    const send = (path, body) => fetch('http://127.0.0.1:' + server.address().port + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = { pdfBase64: pdf.toString('base64') };
    const route = '/api/v1/certificates/public/CITS-00000000000000000000/verify';
    const result = await send(route, data);
    assert.equal(result.status, 200);
    assert.equal((await result.json()).size, pdf.length);
    assert.equal((await send('/api/v1/other', data)).status, 413);
    assert.equal((await send(route, { pdfBase64: 'A'.repeat(8 * 1024 * 1024) })).status, 413);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
