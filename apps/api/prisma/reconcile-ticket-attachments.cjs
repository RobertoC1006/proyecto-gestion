// Ejecución manual: inventario de objetos huérfanos; --apply limpia solo los candidatos antiguos.
// Nunca se ejecuta al iniciar la API ni durante una migración.
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const { createHash } = require('node:crypto');
const { validateConnection } = require('./connection.cjs');

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  if (args.some(arg => arg !== '--apply')) throw Error('Usa --apply o ningún argumento.');
  if (validateConnection(process.env.DATABASE_URL, 'api').local) throw Error('La reconciliación requiere la base compartida de CampusITSM.');
  if (process.env.SUPABASE_URL !== 'https://npjibnlxepiwfermtcmo.supabase.co' || !process.env.SUPABASE_STORAGE_SECRET_KEY) throw Error('Configura el proyecto y la clave privada de Storage.');
  const storage = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_STORAGE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }).storage.from('campusitsm-evidencias');
  const db = new PrismaClient();
  let inspected = 0, candidates = 0, removed = 0;
  const pending = [];
  try {
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await storage.list('', { limit: 100, offset });
      if (error) throw Error('No se pudo listar el bucket.');
      for (const object of data ?? []) {
        if (!/^[A-Za-z0-9_-]+$/.test(object.name) || !object.created_at) continue;
        inspected++;
        const age = Date.now() - new Date(object.created_at).getTime();
        if (!Number.isFinite(age) || age < 24 * 60 * 60 * 1000) continue;
        if (await db.ticketAttachment.findUnique({ where: { storageKey: object.name }, select: { id: true } })) continue;
        candidates++;
        const opaqueId = createHash('sha256').update(object.name).digest('hex').slice(0, 12);
        pending.push({ key: object.name, opaqueId });
      }
      if (!data || data.length < 100) break;
    }
    for (const candidate of pending) {
      if (apply) {
        // Reconsultar antes de borrar; jamás eliminar un objeto ya vinculado.
        if (await db.ticketAttachment.findUnique({ where: { storageKey: candidate.key }, select: { id: true } })) continue;
        const result = await storage.remove([candidate.key]);
        if (result.error) throw Error(`No se pudo limpiar el candidato ${candidate.opaqueId}.`);
        removed++;
      }
      console.log(`${apply ? 'Eliminado' : 'Candidato'} ${candidate.opaqueId}`);
    }
    console.log(JSON.stringify({ inspected, candidates, removed, mode: apply ? 'apply' : 'dry-run' }));
  } finally { await db.$disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
