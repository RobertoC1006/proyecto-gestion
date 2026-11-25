// Burst de lectura autenticada simulada; nunca usa Supabase/Auth ni la base compartida.
require('reflect-metadata');const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {Test}=require('@nestjs/testing');const {AppModule}=require('../dist/app.module');const {AuthService}=require('../dist/auth/auth.service');const {PrismaService}=require('../dist/database/prisma.service');
test('Carga aislada: 500 titulares concurrentes, sin cruces de incidencias',async()=>{
 assert.match(process.env.DATABASE_URL||'',/@db:5432\/workflow_test(?:\?|$)/);
 const institutionId=randomUUID(),users=Array.from({length:500},(_,i)=>({id:randomUUID(),institutionId,email:`load-${i}@example.test`,displayName:`Carga ${i}`,role:'estudiante',active:true,teamId:null,permissions:['tickets:read:self'],csrfVerified:true}));
 const module=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(AuthService).useValue({resolve:async r=>users[Number(r.headers['x-load-user'])]||null}).compile();
 const app=module.createNestApplication({logger:false});app.setGlobalPrefix('api/v1');await app.listen(0,'127.0.0.1');const db=app.get(PrismaService),base=await app.getUrl();
 try{
  await db.institution.create({data:{id:institutionId,code:institutionId,name:'Carga aislada'}});
  await db.appUser.createMany({data:users.map(u=>({id:u.id,institutionId,email:u.email,displayName:u.displayName,role:u.role}))});
  await db.ticket.createMany({data:users.map((u,i)=>({id:randomUUID(),institutionId,ownerId:u.id,code:`LOAD-${institutionId.slice(0,8)}-${i}`,description:'Datos ficticios para prueba de concurrencia aislada.',service:'correo',scope:'general',idempotencyKey:randomUUID(),requestHash:'0'.repeat(64),isDemo:true}))});
  const started=performance.now(),latencies=[];let errors=0;
  await Promise.all(users.map(async(_,i)=>{const at=performance.now();try{
   const response=await fetch(`${base}/api/v1/tickets?pageSize=5`,{headers:{'x-load-user':String(i)}}),body=await response.json();
   if(!response.ok||body.total!==1||body.items.length!==1||body.items[0].code!==`LOAD-${institutionId.slice(0,8)}-${i}`)errors++;
  }catch{errors++}finally{latencies.push(performance.now()-at)}}));
  latencies.sort((a,b)=>a-b);const result={scenario:'500 simultaneous GET /tickets with distinct fixture principals; no external Auth',requests:500,errors,elapsedMs:Math.round(performance.now()-started),p50Ms:Math.round(latencies[249]),p95Ms:Math.round(latencies[474]),maxMs:Math.round(latencies[499]),apiProcessRssMiB:Math.round(process.memoryUsage().rss/1048576)};
  console.log('LOAD_RESULT '+JSON.stringify(result));assert.equal(errors,0);
 }finally{await app.close()}
});
