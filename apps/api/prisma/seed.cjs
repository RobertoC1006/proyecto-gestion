const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  await prisma.$transaction(async (tx) => {
    const institution = await tx.institution.upsert({
      where: { code: 'UPT-DEMO' }, update: {},
      create: { id: '00000000-0000-4000-8000-000000000001', code: 'UPT-DEMO', name: 'Universidad Privada Tallán (ficticia)' },
    });
    await tx.supportTeam.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: 'TI-DEMO' } }, update: {},
      create: { id: '00000000-0000-4000-8000-000000000002', institutionId: institution.id, code: 'TI-DEMO', name: 'Soporte TI — demostración' },
    });
  });
  console.log('Semilla de instalación disponible; registros existentes conservados.');
}

seed().catch(() => { console.error('No se pudo aplicar la semilla.'); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
