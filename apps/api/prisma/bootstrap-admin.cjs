// Herramienta explícita local; nunca crea una cuenta ni eleva al primer visitante.
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const prisma = new PrismaClient();
async function run() {
  const id = process.env.BOOTSTRAP_USER_ID || '';
  if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) throw new Error('Configura BOOTSTRAP_USER_ID con el UUID de tu cuenta confirmada.');
  await prisma.$transaction(async tx => {
    const institution = await tx.institution.findUnique({ where: { code: process.env.AUTH_INSTITUTION_CODE || 'UPT-DEMO' } });
    if (!institution) throw new Error('Ejecuta primero la semilla de instalación.');
    await tx.$queryRaw`SELECT "id" FROM "Institution" WHERE "id" = ${institution.id}::uuid FOR UPDATE`;
    const user = await tx.appUser.findFirst({ where: { id, institutionId: institution.id, active: true } });
    if (!user) throw new Error('La cuenta debe completar primero un login real en esta instalación.');
    const count = await tx.appUser.count({ where: { institutionId: institution.id, role: 'administrador', active: true } });
    if (count > 0) throw new Error('Ya existe un administrador. Los siguientes cambios deben usar el servicio común de permisos.');
    await tx.appUser.update({ where: { id }, data: { role: 'administrador', accessVersion: { increment: 1 } } });
    await tx.identityChange.create({ data: { id: randomUUID(), institutionId: institution.id, actorId: id, subjectId: id,
      reason: 'Inicialización explícita del primer administrador por herramienta local.',
      before: { role: user.role, accessVersion: user.accessVersion }, after: { role: 'administrador', accessVersion: user.accessVersion + 1 } } });
  });
  console.log('Primer administrador configurado. Vuelve a iniciar sesión.');
}
run().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
