// Fixture exclusivo del proyecto Docker de verificación, sin cuentas ni sesión de demostración.
const { PrismaClient } = require('@prisma/client');
const assert = require('node:assert/strict');
const db = new PrismaClient();
const institutionId = '00000000-0000-4000-8000-000000000991';
const id = '00000000-0000-4000-8000-000000000992';
async function run() {
  if (process.argv[2] === 'write') {
    await db.institution.create({ data: { id: institutionId, code: 'CALENDAR-PERSISTENCE-TEST', name: 'Solo prueba de persistencia' } });
    await db.academicEvent.create({ data: { id, institutionId, title: 'Evento conservado tras reinicio', type: 'examen', scope: 'institution', startsAt: new Date('2026-11-06T15:30:00Z'), endsAt: new Date('2026-11-06T17:00:00Z') } });
  } else if (process.argv[2] === 'read') {
    const row = await db.academicEvent.findUniqueOrThrow({ where: { id } });
    assert.equal(row.title, 'Evento conservado tras reinicio');
    assert.equal(row.startsAt.toISOString(), '2026-11-06T15:30:00.000Z');
    console.log('Persistencia de evento académico comprobada después de apagar/arrancar sin borrar volúmenes.');
  } else throw new Error('Indicar write o read.');
}
run().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.$disconnect());
