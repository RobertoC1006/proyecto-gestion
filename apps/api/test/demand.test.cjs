require('reflect-metadata');
const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {PrismaClient}=require('@prisma/client');
const {DemandService}=require('../dist/demand/demand.service');const {DemandJobs}=require('../dist/demand/demand.jobs');
const {Pool}=require('pg');const {PgBoss}=require('pg-boss');
test('Demanda PostgreSQL: fuente, cobertura, permisos, idempotencia y último resultado ante fallo Python',async t=>{
 assert.match(process.env.DATABASE_URL||'',/@db:5432\/workflow_test(?:\?|$)/);
 const db=new PrismaClient(),id=randomUUID(),actor={id:randomUUID(),institutionId:id,active:true,permissions:['reports:read:institution','configuration:manage']},service=new DemandService(db);
 let oldFetch=global.fetch;
 try{
  await db.institution.create({data:{id,code:id,name:'Demanda aislada'}});await db.appUser.create({data:{id:actor.id,institutionId:id,displayName:'Prueba',email:actor.id+'@example.test'}});
  await t.test('Fuente cerrada y permisos efectivos',async()=>{
   await assert.rejects(service.snapshot({...actor,permissions:[]},{}));await assert.rejects(service.snapshot(actor,{source:'mixed'}));
   assert.equal((await service.snapshot(actor,{})).status,'not_generated');
   const observed=await service.observed(id,'2026-11-25');assert.deepEqual(observed.observed,[]);
  });
  await t.test('Corrida manual estable y conservación ante error',async()=>{
   const a=await service.queue(actor,{source:'synthetic',kind:'evaluate'}),b=await service.queue(actor,{source:'synthetic',kind:'evaluate'});assert.equal(a.id,b.id);
   const origin=a.origin.toISOString().slice(0,10),result={status:'available',source:'synthetic',origin,unit:'tickets/day',horizonDays:14,datasetHash:'a'.repeat(64),forecast:Array.from({length:14},(_,i)=>({date:new Date(Date.parse(origin)+i*86400000).toISOString().slice(0,10),value:10,lower:null,upper:null})),observed:[],evaluation:null};
   global.fetch=async()=>({ok:true,json:async()=>result});await service.execute(a.id);
   const next=await service.ensure(id,'synthetic','forecast','failure-check','2026-11-25');global.fetch=async()=>{throw Error('offline')};await assert.rejects(service.execute(next.id));
   const snap=await service.snapshot(actor,{source:'synthetic'});assert.equal(snap.runId,a.id);assert.equal(snap.stale,true);assert.equal(snap.latest.status,'failed');
   await assert.rejects(service.saveConfig(actor,{weeklyCapacity:0,expectedVersion:0,reason:'Configuración de prueba.'}));
   await assert.rejects(service.saveConfig(actor,{weeklyCapacity:350,expectedVersion:0,observedFrom:'2026-13-99',reason:'Fecha inválida de prueba.'}),e=>e.getStatus()===400);
   const config=await service.saveConfig(actor,{weeklyCapacity:300,expectedVersion:0,reason:'Configuración de prueba.'});assert.equal(config.weeklyCapacity,300);
   await assert.rejects(service.saveConfig(actor,{weeklyCapacity:350,expectedVersion:0,reason:'Configuración obsoleta.'}));
  });
 }finally{global.fetch=oldFetch;await db.$disconnect()}
});
test('pg-boss persistente: entrega, deduplicación y migraciones desactivadas',async()=>{
 const connection=process.env.DATABASE_URL;assert.match(connection||'',/@db:5432\/workflow_test(?:\?|$)/);
 const pool=new Pool({connectionString:connection}),boss=new PgBoss({schema:'campusitsm',migrate:false,createSchema:false,schedule:false,supervise:false,persistWarnings:false,persistQueueStats:false,db:{executeSql:async(s,v)=>{const r=await pool.query(s,v);return {rows:Array.isArray(r)?r.flatMap(p=>p.rows||[]):r.rows||[]}}}});
 boss.on('error',()=>{});
 try{
  await boss.start();const key=randomUUID();const a=await boss.send('campus-demand',{runId:key},{singletonKey:key});const b=await boss.send('campus-demand',{runId:key},{singletonKey:key});assert.ok(a);assert.equal(b,null);
  const jobs=await boss.fetch('campus-demand');assert.ok(jobs.some(j=>j.data.runId===key));await boss.complete('campus-demand',a);
  await boss.supervise(); // Incluye lotes SQL de varias sentencias y conserva sus filas de resultado.
  const db=new PrismaClient(),service=new DemandService(db),worker=new DemandJobs(db,service);
  await worker.scheduleDue('forecast',new Date('2026-11-25T10:59:00Z'));await worker.scheduleDue('evaluate',new Date('2026-11-22T06:59:00Z'));
  const rows=await db.forecastRun.findMany({where:{slot:{startsWith:'forecast:'}}});assert.ok(rows.every(r=>r.origin.toISOString().slice(0,10)==='2026-11-24'));
  const weekly=await db.forecastRun.findMany({where:{slot:{startsWith:'evaluate:'}}});assert.ok(weekly.every(r=>r.origin.toISOString().slice(0,10)==='2026-11-15'));
  await db.$disconnect();
 }finally{await boss.stop();await pool.end()}
});
