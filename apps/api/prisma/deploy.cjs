// Acción explícita; nunca se ejecuta al iniciar la API.
const { spawnSync } = require('node:child_process');
const { validateConnection } = require('./connection.cjs');
const { local } = validateConnection(process.env.DATABASE_URL, 'migrate');
const result = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
if (!local) {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  (async () => {
    try {
      // Prisma crea su propio historial: la API solo necesita consultarlo.
      await db.$executeRawUnsafe('REVOKE INSERT, UPDATE, DELETE ON campusitsm."_prisma_migrations" FROM campusitsm_api');
      console.log('Migración completada; historial protegido frente a escrituras de la API.');
    } finally { await db.$disconnect(); }
  })().catch(() => { console.error('No se pudo proteger el historial. No iniciar la aplicación hasta revisarlo.'); process.exitCode = 1; });
}
