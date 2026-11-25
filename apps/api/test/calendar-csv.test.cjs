require('reflect-metadata');
const {test}=require('node:test'); const assert=require('node:assert/strict'); const {randomUUID}=require('node:crypto');
const {PrismaClient}=require('@prisma/client'); const {AcademicService}=require('../dist/academic/academic.service');
const {parseCalendarCsv}=require('../dist/academic/academic.csv');
test('CSV: comillas RFC4180, límites y archivo incompleto',()=>{
 const h='title,type,scope,courseCode,sectionCode,startsAt,endsAt\n';
 assert.equal(parseCalendarCsv(h+'"Examen, \"\"A\"\"",examen,institution,,,a,b')[0][0],'Examen, "A"');
 assert.throws(()=>parseCalendarCsv(h+'"sin cerrar')); assert.throws(()=>parseCalendarCsv('x'.repeat(50000)));
});
test('CSV PostgreSQL: vista previa, atomicidad, duplicados y dos confirmaciones concurrentes',async()=>{
 assert.match(process.env.DATABASE_URL||'',/@db:5432\/workflow_test(?:\?|$)/);
 const db=new PrismaClient(),id=randomUUID(),actor={id:randomUUID(),institutionId:id,role:'administrador',permissions:['academic:manage']};
 const service=new AcademicService(db,{}),reason='Importación de prueba aislada.';
 const csv='title,type,scope,courseCode,sectionCode,startsAt,endsAt\n"Evaluación, prueba",examen,institution,,,2026-12-01T09:00:00-05:00,2026-12-01T11:00:00-05:00';
 try{
  await db.institution.create({data:{id,code:id,name:'CSV aislado'}});
  await db.appUser.create({data:{id:actor.id,institutionId:id,displayName:'Prueba CSV',email:actor.id+'@example.test',role:'administrador'}});
  const p=await service.importCsv(actor,{csv,reason},false); assert.equal(p.valid,true);assert.equal(await db.academicEvent.count({where:{institutionId:id}}),0);
  const invalid=csv+'\nInválido,examen,course,AJENO,,2026-12-02T09:00:00-05:00,2026-12-02T11:00:00-05:00';
  assert.equal((await service.importCsv(actor,{csv:invalid,reason},false)).valid,false);
  await assert.rejects(service.importCsv(actor,{csv:invalid,reason},true));assert.equal(await db.academicEvent.count({where:{institutionId:id}}),0);
  const results=await Promise.all([service.importCsv(actor,{csv,reason},true),service.importCsv(actor,{csv,reason},true)]);
  assert.deepEqual(results.map(r=>r.imported).sort(),[0,1]);assert.equal(await db.academicEvent.count({where:{institutionId:id}}),1);
  assert.equal(await db.academicChange.count({where:{institutionId:id,source:'csv'}}),1);
  await assert.rejects(service.importCsv({...actor,permissions:[]},{csv,reason},true));
 }finally{await db.$disconnect()}
});
