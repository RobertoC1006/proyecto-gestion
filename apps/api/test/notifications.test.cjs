require('reflect-metadata');
const {test}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {PrismaClient}=require('@prisma/client');const {NotificationsService}=require('../dist/notifications/notifications.service');
const {publishNotification}=require('../dist/notifications/notification.events');const {rolePermissions}=require('../dist/auth/auth.policy');
test('Avisos y alertas PostgreSQL: outbox recuperable, destinatario, SLA y semanas únicas',async t=>{
 assert.match(process.env.DATABASE_URL||'',/@db:5432\/workflow_test(?:\?|$)/);
 const db=new PrismaClient(),institutionId=randomUUID(),userId=randomUUID(),otherId=randomUUID(),adminId=randomUUID();
 const permissions={effective:async(_i,role)=>rolePermissions[role]},service=new NotificationsService(db,permissions);
 const user={id:userId,institutionId,active:true,permissions:['tickets:read:self']},other={...user,id:otherId},admin={id:adminId,institutionId,active:true,permissions:rolePermissions.administrador};
 try{
  await db.institution.create({data:{id:institutionId,code:institutionId,name:'Avisos aislados'}});
  for(const [id,role]of [[userId,'estudiante'],[otherId,'estudiante'],[adminId,'administrador']])await db.appUser.create({data:{id,institutionId,email:id+'@example.test',displayName:'Prueba aislada',role}});
  await t.test('Publicación atómica, replay y titular de lectura',async()=>{
   const event={id:randomUUID(),institutionId,recipientId:userId,type:'resolution',title:'Prueba',body:'Aviso aislado',href:'/incidencias'};
   await assert.rejects(db.$transaction(async tx=>{await publishNotification(tx,event);throw Error('rollback')}));assert.equal(await db.notificationEvent.count({where:{id:event.id}}),0);
   await db.$transaction(tx=>publishNotification(tx,event));await Promise.all([service.process(),service.process()]);await service.process();
   const result=await service.list(user,{});assert.equal(result.total,1);assert.equal(result.unreadCount,1);assert.equal((await service.list(other,{})).total,0);
   await assert.rejects(service.mark(other,result.items[0].id));await service.mark(user,result.items[0].id);assert.equal((await service.list(user,{})).unreadCount,0);
  });
  await t.test('80 %, vencimiento y primera atención humana no se duplican',async()=>{
   const start=new Date('2026-11-25T10:00:00Z'),due=new Date('2026-11-25T11:00:00Z');
   const row=await db.ticket.create({data:{institutionId,ownerId:userId,code:'SLA-'+randomUUID(),description:'Incidencia ficticia para prueba aislada.',service:'correo',scope:'general',idempotencyKey:randomUUID(),requestHash:'0'.repeat(64),createdAt:start,responseDueAt:due,assigneeId:adminId,isDemo:true}});
   await service.scanSla(new Date('2026-11-25T10:47:00Z'));assert.equal(await db.notificationEvent.count({where:{id:{startsWith:'sla:'+row.id}}}),0);
   await service.scanSla(new Date('2026-11-25T10:48:00Z'));await service.scanSla(new Date('2026-11-25T10:49:00Z'));
   assert.equal(await db.notificationEvent.count({where:{id:{startsWith:'sla:'+row.id},type:'sla80'}}),1);
   await service.scanSla(new Date('2026-11-25T11:00:00Z'));assert.equal(await db.notificationEvent.count({where:{id:{startsWith:'sla:'+row.id},type:'sla_overdue'}}),1);
   await db.ticket.update({where:{id:row.id},data:{firstResponseAt:new Date()}});await service.scanSla(new Date('2026-11-26T11:00:00Z'));
   assert.equal(await db.notificationEvent.count({where:{id:{startsWith:'sla:'+row.id}}}),2);
  });
  await t.test('Una alerta por semana, revisión idempotente y sin cambios de tickets',async()=>{
   const origin=new Date();origin.setUTCDate(origin.getUTCDate()+((8-origin.getUTCDay())%7||7));const day=origin.toISOString().slice(0,10);
   const result={forecast:Array.from({length:14},(_,i)=>({date:new Date(Date.parse(day)+i*86400000).toISOString().slice(0,10),value:100}))};
   const run=await db.forecastRun.create({data:{institutionId,source:'synthetic',kind:'forecast',slot:'alerts-test',origin:new Date(day),status:'completed',result}});
   await service.updateAlerts(run.id);await service.updateAlerts(run.id);await service.process();
   const alerts=await service.alerts(admin,{source:'synthetic'});assert.equal(alerts.items.length,2);assert.equal((await service.list(admin,{type:'demand'})).total,2);
   await assert.rejects(service.alerts(user,{}));const target=alerts.items[0];
   await service.review(admin,target.id,{reason:'Revisión de capacidad de prueba.'});await service.review(admin,target.id,{reason:'Reintento de revisión de prueba.'});
   assert.equal(await db.academicChange.count({where:{institutionId,entityType:'demand-alert',entityId:target.id}}),1);
  });
 }finally{await db.$disconnect()}
});
