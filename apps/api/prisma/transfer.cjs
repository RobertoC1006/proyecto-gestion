// Traslado único, sin borrar ni sobrescribir el destino. Entrada/salida privadas.
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { validateConnection } = require('./connection.cjs');
const tables = ['Institution', 'SupportTeam', 'AcademicCourse', 'AcademicSection', 'AcademicMembership',
  'AcademicEvent', 'AcademicChange', 'AppUser', 'IdentityChange', 'AuthSession', 'AuthFlow', 'AuthThrottle'];
const db = new PrismaClient();
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
const hash = rows => createHash('sha256').update(JSON.stringify(rows.map(canonical).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))))).digest('hex');
async function read(tx, table) {
  const [result] = await tx.$queryRawUnsafe(`SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) AS rows FROM "${table}" t`);
  return result.rows;
}
async function main() {
  const mode = process.argv[2];
  if (mode === 'export') {
    if (!validateConnection(process.env.DATABASE_URL, 'api').local) throw new Error('Exportación reservada al origen local de este traslado.');
    const key = Buffer.from(process.env.AUTH_ENCRYPTION_KEY || '', 'base64');
    if (key.length !== 32) throw new Error('Se necesita la clave de la instalación de origen.');
    const instanceId = createHash('sha256').update(key).digest('hex');
    const data = await db.$transaction(async tx => {
      const snapshot = {};
      for (const table of tables) {
        snapshot[table] = await read(tx, table);
        if (['AuthSession', 'AuthFlow'].includes(table)) snapshot[table].forEach(row => { row.instanceId = instanceId; });
      }
      return snapshot;
    }, { isolationLevel: 'RepeatableRead' });
    fs.writeFileSync(process.argv[3], JSON.stringify(data), { mode: 0o600 });
  } else if (mode === 'import') {
    if (validateConnection(process.env.DATABASE_URL, 'api').local) throw new Error('El traslado exige el destino remoto.');
    const data = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
    const report = await db.$transaction(async tx => {
      for (const table of tables) {
        if (!Array.isArray(data[table])) throw new Error('Exportación incompleta.');
        if ((await read(tx, table)).length) throw new Error(`El destino ${table} tiene datos; no sobrescribir.`);
      }
      const result = {};
      for (const table of tables) {
        if (data[table].length) await tx.$executeRawUnsafe(`INSERT INTO "${table}" SELECT * FROM jsonb_populate_recordset(NULL::"${table}", $1::jsonb)`, JSON.stringify(data[table]));
        const after = await read(tx, table);
        if (hash(after) !== hash(data[table])) throw new Error(`Diferencia de contenido en ${table}; se revierte el traslado completo.`);
        result[table] = { count: after.length, sha256: hash(after) };
      }
      return result;
    }, { timeout: 60000, maxWait: 15000 });
    fs.writeFileSync(process.argv[4], JSON.stringify(report, null, 2));
    console.log('Traslado atómico completado: conteos y contenido de todas las tablas coinciden.');
  } else throw new Error('Usa export o import con rutas privadas.');
}
main().catch(e => { console.error(e.code || 'TRANSFER_FAILED', 'Revisa el traslado privado; no se imprimen datos ni credenciales.'); process.exitCode = 1; }).finally(() => db.$disconnect());
