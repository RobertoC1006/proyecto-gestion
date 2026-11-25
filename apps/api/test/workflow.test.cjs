require('reflect-metadata');
const {test}=require('node:test');const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');
const {Test}=require('@nestjs/testing');const {AppModule}=require('../dist/app.module');
const {AuthService}=require('../dist/auth/auth.service');const {AcademicIdentity}=require('../dist/academic/academic.access');
const {PrismaService}=require('../dist/database/prisma.service');const {rolePermissions}=require('../dist/auth/auth.policy');
const {contextualFactor,calculate,defaultRules}=require('../dist/tickets/priority');

test('Factores y fronteras temporales del caso',()=>{
 const at=new Date('2026-11-12T15:00:00Z');const event=(type,start,end)=>({id:randomUUID(),title:type,type,startsAt:new Date(at.getTime()+start),endsAt:new Date(at.getTime()+end)});
 assert.equal(contextualFactor([event('examen',1800000,7200000)],at).factor,2);
 assert.equal(contextualFactor([event('examen',86400000,90000000)],at).factor,1);
 assert.equal(contextualFactor([event('examen',-7200000,-1)],at).factor,1);
 assert.equal(contextualFactor([event('entrega',172800000,180000000)],at).factor,1);
 assert.equal(contextualFactor([event('matricula',-1000,10000),event('entrega',5000,10000)],at).factor,1.7);
 for(const [u,i,f,score,p] of [[3,2,2,12,'P1'],[3,3,1,9,'P1'],[2,2,1.5,6,'P2'],[2,1,1,2,'P4'],[1,3,1,3,'P3']]){
  const c=calculate(u,i,f,defaultRules);assert.equal(c.score,score);assert.equal(c.rule.priority,p);
 }
});

test('Flujo HTTP con PostgreSQL aislado: calendario, contexto, cola y resolución',async t=>{
 // Garantía de destino: ninguna prueba de escritura admite Supabase ni la base de trabajo.
 assert.match(process.env.DATABASE_URL??'',/@db:5432\/workflow_test(?:\?|$)/);
 const institutionId=randomUUID(),other=randomUUID();
 const principal=(role,institution=institutionId)=>({id:randomUUID(),institutionId:institution,email:'fixture@example.test',displayName:role,role,active:true,teamId:null,accessVersion:1,csrfVerified:true,permissions:rolePermissions[role]});
 const users={admin:principal('administrador'),student:principal('estudiante'),stranger:principal('estudiante'),professor:principal('docente'),other:principal('administrador',other),external:principal('estudiante',other),reader:{...principal('ti_supervisor'),permissions:['tickets:read:institution']}};
 const builder=Test.createTestingModule({imports:[AppModule]});
 const module=await builder.overrideProvider(AuthService).useValue({resolve:async r=>users[r.headers['x-test-session']]??null})
 .overrideProvider(AcademicIdentity).useValue({resolve:async r=>users[r.headers['x-test-session']]??null}).compile();
 const app=module.createNestApplication({logger:false});app.setGlobalPrefix('api/v1');await app.listen(0,'127.0.0.1');
 const db=app.get(PrismaService),url=await app.getUrl();
 const call=async(path,session='admin',method='GET',body,headers={})=>{const r=await fetch(`${url}/api/v1/${path}`,{method,headers:{'content-type':'application/json','x-test-session':session,...headers},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()}};
 try{
  await db.institution.createMany({data:[{id:institutionId,code:institutionId,name:'Prueba aislada'},{id:other,code:other,name:'Otra institución'}]});
  for(const u of Object.values(users))await db.appUser.create({data:{id:u.id,institutionId:u.institutionId,email:`${u.id}@example.test`,displayName:u.displayName,role:u.role}});
  let tickets,first;
  await t.test('Anónimo y estudiante no acceden a operaciones de TI',async()=>{
   assert.equal((await call('operations/tickets','missing')).status,401);
   assert.equal((await call('operations/tickets','student')).status,403);
   assert.equal((await call('operations/demo','student','POST',{studentId:users.student.id})).status,403);
  });
  await t.test('Cuatro casos idempotentes; puntajes 12, 9, 6 y 2',async()=>{
   const r=await call('operations/demo','admin','POST',{studentId:users.student.id,professorId:users.professor.id});assert.equal(r.status,201,JSON.stringify(r.body));
   const queue=await call('operations/tickets');assert.equal(queue.status,200);tickets=queue.body.items;
   assert.deepEqual(tickets.map(x=>x.score),[12,9,6,2]);assert.deepEqual(tickets.map(x=>x.priority),['P1','P1','P2','P4']);first=tickets[0];
   assert.equal((await call('operations/demo','admin','POST',{studentId:users.student.id,professorId:users.professor.id})).status,201);
   assert.equal(await db.ticket.count({where:{institutionId}}),4);assert.equal(await db.academicEvent.count({where:{institutionId}}),2);
  });
  await t.test('Orden técnico y contextual distintos; aislamiento institucional',async()=>{
   const technical=(await call('operations/tickets?order=technical')).body.items;assert.equal(technical[0].technicalScore,9);assert.notEqual(technical[0].id,first.id);
   assert.equal((await call('operations/tickets','other')).body.total,0);
   assert.equal((await call(`operations/tickets/${first.id}`,'other')).status,404);
   assert.equal((await call(`tickets/${first.id}`,'stranger')).status,404);
   const own=await call(`tickets/${first.id}`,'student');assert.equal(own.status,200);assert.equal(own.body.score,undefined);assert.ok(own.body.changes.length);
  });
  await t.test('El profesor solo programa en sus secciones, con autoría y versiones',async()=>{
   const section=await db.academicSection.findFirst({where:{institutionId}});
   const at=Date.now()+3600000;const data={title:'Actividad del profesor',type:'examen',scope:'section',courseId:section.courseId,sectionId:section.id,startsAt:new Date(at).toISOString(),endsAt:new Date(at+3600000).toISOString(),reason:'Programación de evaluación.'};
   const r=await call('academic/events','professor','POST',data);assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.createdById,users.professor.id);
   assert.equal((await call('academic/events','student','POST',data)).status,403);
   assert.equal((await call('academic/events','professor','POST',{...data,scope:'institution',courseId:null,sectionId:null})).status,404);
   const otherCourse=await db.academicCourse.create({data:{institutionId,code:'UNASSIGNED',name:'No asignado'}});const otherSection=await db.academicSection.create({data:{institutionId,courseId:otherCourse.id,code:'Z',name:'Z'}});
   assert.equal((await call('academic/events','professor','POST',{...data,courseId:otherCourse.id,sectionId:otherSection.id})).status,404);
   assert.equal((await call('academic/me/context?courseId='+otherCourse.id,'student')).status,400);
   assert.equal((await call('academic/me/courses','professor')).body.total,2);
  });
  await t.test('Reintentos de creación no duplican reportes y rechazan cambio de contenido',async()=>{
   const key=randomUUID(),body={description:'Reporte de falla general para verificar reintentos.',service:'correo',scope:'general',courseId:null,sectionId:null};
   const a=await call('tickets','student','POST',body,{'Idempotency-Key':key});const b=await call('tickets','student','POST',body,{'Idempotency-Key':key});
   assert.equal(a.status,201);assert.equal(b.status,200);assert.equal(a.body.id,b.body.id);
   assert.equal((await call('tickets','student','POST',{...body,description:body.description+' Cambio.'},{'Idempotency-Key':key})).status,409);
  });
  await t.test('Atención humana, conflictos concurrentes y resolución sin reiniciar SLA',async()=>{
   const due=first.responseDueAt;
   const body={action:'evaluate',expectedVersion:first.version,urgency:3,impact:2,note:'Evaluación revisada sin alterar el tiempo inicial.'};
   const results=await Promise.all([call(`operations/tickets/${first.id}`,'admin','PATCH',body),call(`operations/tickets/${first.id}`,'admin','PATCH',body)]);
   assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);let current=(await call(`operations/tickets/${first.id}`)).body;assert.equal(current.responseDueAt,due);assert.equal(current.firstResponseAt,null);
   const start=await call(`operations/tickets/${first.id}`,'admin','PATCH',{action:'start',expectedVersion:current.version,note:'Verificando el acceso del estudiante al examen.'});assert.equal(start.status,200);assert.ok(start.body.firstResponseAt);assert.equal(start.body.status,'en_atencion');
   const done=await call(`operations/tickets/${first.id}`,'admin','PATCH',{action:'resolve',expectedVersion:start.body.version,note:'Se completó la atención de prueba.',solution:'Se restableció el acceso al aula virtual y se verificó el ingreso.',failureConfirmed:true});assert.equal(done.status,200);assert.equal(done.body.status,'resuelto');assert.equal(done.body.responseDueAt,due);
   const own=(await call(`tickets/${first.id}`,'student')).body;assert.equal(own.status,'resuelto');assert.ok(own.solution);assert.ok(own.changes.some(c=>c.action==='resolve'));
   assert.ok(!(await call('operations/tickets')).body.items.some(x=>x.id===first.id));
   assert.equal((await call(`operations/tickets/${first.id}`,'admin','PATCH',{action:'start',expectedVersion:done.body.version,note:'No se debe reabrir.'})).status,400);
  });
  await t.test('Política valida umbrales y conflictos sin alterar tickets históricos',async()=>{
   const before=(await call('operations/policy')).body;
   assert.equal((await call('operations/policy','admin','PATCH',{expectedVersion:before.version,rules:[...defaultRules].reverse(),reason:'Configuración inválida.'})).status,400);
   const valid=await call('operations/policy','admin','PATCH',{expectedVersion:before.version,rules:defaultRules,reason:'Configurar los plazos del caso.'});assert.equal(valid.status,200);
   assert.equal((await call('operations/policy','admin','PATCH',{expectedVersion:before.version,rules:defaultRules,reason:'Versión desactualizada.'})).status,409);
  });
  await t.test('Filtros activos/resueltos y resumen personal aíslan titular e institución', async () => {
   const report = {description:'Incidencia general para comprobar aislamiento de conteos.',service:'correo',scope:'general',courseId:null,sectionId:null};
   const foreignTickets = [];
   for (const session of ['stranger', 'external']) {
    const created = await call('tickets', session, 'POST', report, {'Idempotency-Key':randomUUID()});
    assert.equal(created.status, 201, JSON.stringify(created.body));
    foreignTickets.push(created.body);
    assert.deepEqual(await call('tickets/summary', session), {status:200, body:{total:1,registered:1,inAttention:0,resolved:0}});
    const list = await call('tickets?status=active', session);
    assert.equal(list.status, 200);
    assert.deepEqual(list.body, {items:[created.body],total:1,page:1,pageSize:20});
   }
   const started = await call(`operations/tickets/${tickets[1].id}`, 'admin', 'PATCH', {
    action:'start',expectedVersion:tickets[1].version,note:'Atención para comprobar el filtro de incidencias activas.'});
   assert.equal(started.status, 200, JSON.stringify(started.body));
   const all = await call('tickets', 'student');
   assert.equal(all.status, 200);
   assert.equal(all.body.total, 5);
   assert.equal(all.body.items.length, 5);
   assert.equal(all.body.page, 1);
   assert.equal(all.body.pageSize, 20);
   assert.ok(all.body.items.every(item => !foreignTickets.some(foreign => foreign.id === item.id)));
   const summary = {status:200,body:{total:5,registered:3,inAttention:1,resolved:1}};
   assert.deepEqual(await call('tickets/summary', 'student'), summary);
   // Same subject in another tenant context must not recover the original tenant's data.
   users.otherContext = {...users.student, institutionId:other};
   assert.deepEqual(await call('tickets/summary', 'otherContext'), {
    status:200,body:{total:0,registered:0,inAttention:0,resolved:0}});
   assert.deepEqual(await call('tickets?status=active', 'otherContext'), {
    status:200,body:{items:[],total:0,page:1,pageSize:20}});
   assert.deepEqual(await call(`tickets/${first.id}`, 'otherContext'), {
    status:404,body:{code:'NOT_FOUND',message:'No se encontró el ticket.'}});
   for (const [status, expected] of [
    ['active', all.body.items.filter(item => item.status !== 'resuelto')],
    ['resuelto', all.body.items.filter(item => item.status === 'resuelto')],
    ['registrado', all.body.items.filter(item => item.status === 'registrado')],
    ['en_atencion', all.body.items.filter(item => item.status === 'en_atencion')],
   ]) {
    assert.deepEqual(await call(`tickets?status=${status}`, 'student'), {
     status:200,body:{items:expected,total:expected.length,page:1,pageSize:20}});
    assert.deepEqual(await call('tickets/summary', 'student'), summary);
   }
   const searched = all.body.items[0];
   assert.deepEqual(await call(`tickets?search=${searched.code}&pageSize=1`, 'student'), {
    status:200,body:{items:[searched],total:1,page:1,pageSize:1}});
   assert.deepEqual(await call(`tickets?search=${foreignTickets[0].code}`, 'student'), {
    status:200,body:{items:[],total:0,page:1,pageSize:20}});
   assert.deepEqual(await call('tickets/summary', 'missing'), {
    status:401,body:{code:'SESSION_REQUIRED',message:'Necesitas una sesión válida.'}});
   assert.deepEqual(await call('tickets/summary', 'reader'), {
    status:403,body:{code:'FORBIDDEN',message:'No tienes permiso para realizar esta operación.'}});
  });
  await t.test('Responsable visible o nulo sin UUID interno ni asignación ajena', async () => {
   const id = tickets[2].id;
   const before = await call(`tickets/${id}`, 'student');
   assert.equal(before.status, 200);
   assert.equal(before.body.assigneeName, null);
   assert.equal(Object.hasOwn(before.body, 'assigneeId'), false);
   const assigned = await call(`operations/tickets/${id}`, 'admin', 'PATCH', {
    action:'assign',expectedVersion:before.body.version,assigneeId:users.admin.id,note:'Asignación al responsable de esta institución.'});
   assert.equal(assigned.status, 200, JSON.stringify(assigned.body));
   assert.equal(assigned.body.assigneeId, users.admin.id);
   const own = await call(`tickets/${id}`, 'student');
   assert.equal(own.status, 200);
   assert.equal(own.body.assigneeName, users.admin.displayName);
   assert.equal(Object.hasOwn(own.body, 'assigneeId'), false);
   assert.equal(JSON.stringify(own.body).includes(users.admin.id), false);
   const detail = await call(`operations/tickets/${id}`);
   assert.equal(detail.status, 200);
   assert.equal(detail.body.assigneeName, users.admin.displayName);
   assert.deepEqual(await call(`operations/tickets/${id}`, 'admin', 'PATCH', {
    action:'assign',expectedVersion:assigned.body.version,assigneeId:users.other.id,note:'No permitir responsables de otra institución.'}), {
    status:400,body:{code:'VALIDATION_ERROR',message:'Revisa los campos indicados.',fields:{assigneeId:'Selecciona un encargado de TI activo de esta institución.'}}});
   assert.deepEqual(await call(`operations/tickets/${id}`), detail);
   assert.deepEqual(await call(`tickets/${id}`, 'student'), own);
   const notFound = {status:404,body:{code:'NOT_FOUND',message:'No se encontró el ticket.'}};
   assert.deepEqual(await call(`tickets/${id}`, 'stranger'), notFound);
   assert.deepEqual(await call(`tickets/${id}`, 'external'), notFound);
   assert.deepEqual(await call(`tickets/${randomUUID()}`, 'student'), notFound);
  });
  await t.test('Corrección manual autorizada conserva prioridad/SLA y audita una sola vez', async () => {
   const id = tickets[2].id;
   const snapshot = async (ticketId = id) => {
    const detail = await call(`operations/tickets/${ticketId}`);
    const own = await call(`tickets/${ticketId}`, 'student');
    const queue = await call('operations/tickets');
    const summary = await call('tickets/summary', 'student');
    const list = await call('tickets', 'student');
    for (const result of [detail, own, queue, summary, list]) assert.equal(result.status, 200);
    return {detail:detail.body,own:own.body,queue:queue.body,summary:summary.body,list:list.body};
   };
   const before = await snapshot();
   assert.ok(before.detail.priority);
   assert.ok(before.detail.responseDueAt);
   assert.ok(before.detail.resolutionDueAt);
   const catalog = await call('operations/services');
   assert.equal(catalog.status, 200);
   assert.deepEqual(await call('tickets/services', 'student'), catalog);
   const target = catalog.body.find(service => service.id !== before.detail.service).id;
   const note = 'Corrección manual del servicio sin recalcular prioridad ni reiniciar plazos.';
   const action = {action:'reclassify',expectedVersion:before.detail.version,service:target,note};
   const validation = (field, message) => ({status:400,body:{code:'VALIDATION_ERROR',message:'Revisa los campos indicados.',fields:{[field]:message}}});
   for (const [session, body, expected] of [
    ['student',action,{status:403,body:{code:'FORBIDDEN',message:'No tienes permiso para realizar esta operación.'}}],
    ['reader',action,{status:403,body:{code:'FORBIDDEN',message:'No tienes permiso para realizar esta operación.'}}],
    ['other',action,{status:404,body:{message:'Not Found',statusCode:404}}],
    ['admin',{...action,service:'inexistente'},validation('service','Selecciona un servicio válido.')],
    ['admin',{...action,service:before.detail.service},validation('service','Selecciona un servicio distinto para registrar la corrección.')],
    ['admin',{...action,note:'cort'},validation('note','Usa entre 5 y 2000 caracteres.')],
   ]) {
    assert.deepEqual(await call(`operations/tickets/${id}`, session, 'PATCH', body), expected);
    assert.deepEqual(await snapshot(), before, `La solicitud rechazada de ${session} no cambia datos, conteos ni historial`);
   }
   const corrected = await call(`operations/tickets/${id}`, 'admin', 'PATCH', action);
   assert.equal(corrected.status, 200, JSON.stringify(corrected.body));
   const {ownerName,courseName,assigneeName,changes,...previous} = before.detail;
   assert.deepEqual(corrected.body, {...previous,service:target,classificationStatus:'manual',version:previous.version+1,updatedAt:corrected.body.updatedAt});
   assert.ok(Date.parse(corrected.body.updatedAt) >= Date.parse(previous.updatedAt));
   const after = await snapshot();
   assert.equal(after.detail.service, target);
   assert.equal(after.detail.version, previous.version+1);
   assert.equal(after.detail.changes.length, changes.length+1);
   for (const change of changes) assert.deepEqual(after.detail.changes.find(item => item.id === change.id), change);
   const added = after.detail.changes.filter(item => !changes.some(old => old.id === item.id));
   assert.equal(added.length, 1);
   assert.deepEqual(added[0], {id:added[0].id,action:'reclassify',note,createdAt:added[0].createdAt});
   assert.match(added[0].id, /^[0-9a-f-]{36}$/);
   assert.ok(Number.isFinite(Date.parse(added[0].createdAt)));
   assert.equal(after.own.service, target);
   assert.deepEqual(after.own.changes, after.detail.changes);
   assert.deepEqual(after.summary, before.summary);
   assert.deepEqual(await call(`operations/tickets/${id}`, 'admin', 'PATCH', {...action,service:previous.service}), {
    status:409,body:{code:'CONFLICT',message:'El ticket cambió. Actualiza antes de continuar.'}});
   assert.deepEqual(await snapshot(), after);
   const resolved = await snapshot(first.id);
   assert.deepEqual(await call(`operations/tickets/${first.id}`, 'admin', 'PATCH', {...action,expectedVersion:resolved.detail.version}),
    validation('action','La incidencia ya está resuelta.'));
   assert.deepEqual(await snapshot(first.id), resolved);
  });
 }finally{await app.close()}
});
