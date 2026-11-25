import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CampusPrincipal, requirePermission } from '../auth/auth.policy';
import { RolePermissionsService } from '../auth/role-permissions.service';
import { invalid, object, positive, reason, uuid } from '../academic/academic.validation';
import { addDays, DemandResult, limaDay } from '../demand/demand.types';
import { demandSource } from '../demand/demand.service';
import { publishNotification } from './notification.events';
@Injectable()
export class NotificationsService{
 constructor(private readonly db:PrismaService,private readonly permissions:RolePermissionsService){}
 async list(actor:CampusPrincipal,raw:unknown){
  const q=object(raw),type=q.type==null?'':String(q.type),unread=q.unread==='true';
  if(type&&!['assignment','resolution','certificate','sla80','sla_overdue','demand'].includes(type))invalid('type','Tipo de aviso no válido.');
  const page=q.page==null?1:positive(q.page,'page',100000),pageSize=30;
  const own={institutionId:actor.institutionId,recipientId:actor.id},where={...own,...(type?{type}:{}),...(unread?{readAt:null}:{})};
  const [items,total,unreadCount]=await this.db.$transaction([this.db.notification.findMany({where,orderBy:[{createdAt:'desc'},{id:'desc'}],take:pageSize,skip:(page-1)*pageSize}),this.db.notification.count({where}),this.db.notification.count({where:{...own,readAt:null}})]);
  return {items,total,unreadCount,page,pageSize};
 }
 async mark(actor:CampusPrincipal,id:string){
  const where={id:uuid(id,'id'),institutionId:actor.institutionId,recipientId:actor.id};
  if(!await this.db.notification.findFirst({where}))throw new NotFoundException();
  await this.db.notification.updateMany({where:{...where,readAt:null},data:{readAt:new Date()}});return {read:true};
 }
 async operators(institutionId:string){
  const users=await this.db.appUser.findMany({where:{institutionId,active:true},select:{id:true,role:true}}),result=[];
  for(const u of users)if((await this.permissions.effective(institutionId,u.role)).includes('tickets:work:institution'))result.push(u.id);
  return result;
 }
 async process(){
  // SKIP LOCKED permite a las tres instalaciones compartir la cola sin duplicados.
  await this.db.$transaction(async tx=>{
   const rows=await tx.$queryRaw<{id:string}[]>`SELECT "id" FROM "NotificationEvent" WHERE "processedAt" IS NULL ORDER BY "createdAt","id" LIMIT 100 FOR UPDATE SKIP LOCKED`;
   for(const row of rows){
    const event=await tx.notificationEvent.findUniqueOrThrow({where:{id:row.id}});
    const {id,processedAt,createdAt,...data}=event;
    const user=await tx.appUser.findFirst({where:{id:event.recipientId,institutionId:event.institutionId,active:true},select:{id:true}});
    if(user)await tx.notification.createMany({data:[{...data,eventKey:id}],skipDuplicates:true});
    await tx.notificationEvent.update({where:{id},data:{processedAt:new Date()}});
   }
  },{timeout:20000});
 }
 async scanSla(at=new Date()){
  const tickets=await this.db.ticket.findMany({where:{firstResponseAt:null,status:{not:'resuelto'},responseDueAt:{not:null}},select:{id:true,institutionId:true,createdAt:true,responseDueAt:true,assigneeId:true,code:true,isDemo:true}});
  const cache=new Map<string,string[]>();
  for(const ticket of tickets){
   const due=ticket.responseDueAt!.getTime(),threshold=ticket.createdAt.getTime()+(due-ticket.createdAt.getTime())*0.8;
   if(at.getTime()<threshold)continue;const type=at.getTime()>=due?'sla_overdue':'sla80';
   if(!cache.has(ticket.institutionId))cache.set(ticket.institutionId,await this.operators(ticket.institutionId));
   const eligible=cache.get(ticket.institutionId)!;
   await this.db.$transaction(async tx=>{
    // Releer bajo bloqueo: una atención simultánea suprime el aviso.
    await tx.$queryRaw`SELECT "id" FROM "Ticket" WHERE "id"=${ticket.id}::uuid FOR UPDATE`;
    const fresh=await tx.ticket.findUnique({where:{id:ticket.id},select:{firstResponseAt:true,status:true,responseDueAt:true,assigneeId:true}});
    if(!fresh||fresh.firstResponseAt||fresh.status==='resuelto'||fresh.responseDueAt?.getTime()!==due)return;
    const recipients=fresh.assigneeId&&eligible.includes(fresh.assigneeId)?[fresh.assigneeId]:eligible;
    for(const recipientId of recipients)await publishNotification(tx,{id:`sla:${ticket.id}:${type}:${recipientId}`,institutionId:ticket.institutionId,recipientId,type,title:type==='sla80'?'Primera respuesta próxima a vencer':'Plazo de primera respuesta vencido',body:`Incidencia ${ticket.code}. ${type==='sla80'?'Se alcanzó el 80 % del plazo.':'Revisa la atención pendiente.'}`,href:`/ti/tickets/${ticket.id}`,isDemo:ticket.isDemo});
   });
  }
 }
 async updateAlerts(runId:string){
  const run=await this.db.forecastRun.findUnique({where:{id:runId}});if(!run||run.status!=='completed')return;
  const result=run.result as unknown as DemandResult,config=await this.db.demandConfig.findUnique({where:{institutionId:run.institutionId}}),capacity=config?.weeklyCapacity??350;
  const weeks=new Map<string,number[]>();
  for(const p of result.forecast){const day=new Date(p.date+'T12:00:00Z'),weekday=(day.getUTCDay()+6)%7,key=addDays(p.date,-weekday);weeks.set(key,[...(weeks.get(key)||[]),p.value])}
  const recipients=(await this.db.appUser.findMany({where:{institutionId:run.institutionId,active:true},select:{id:true,role:true}})),allowed:string[]=[];
  for(const user of recipients)if((await this.permissions.effective(run.institutionId,user.role)).includes('reports:read:institution'))allowed.push(user.id);
  await this.db.$transaction(async tx=>{
   for(const [day,values]of weeks){
    if(values.length!==7||addDays(day,7)<=limaDay())continue;
    const expected=values.reduce((a,b)=>a+b,0),key={institutionId:run.institutionId,source:run.source,weekStart:new Date(day)};
    const previous=await tx.demandAlert.findUnique({where:{institutionId_source_weekStart:key}});
    if(expected<=capacity&&!previous)continue;
    const alert=await tx.demandAlert.upsert({where:{institutionId_source_weekStart:key},create:{...key,runId,expected,capacity,active:expected>capacity},update:{runId,expected,capacity,active:expected>capacity}});
    if(expected>capacity)for(const recipientId of allowed)await publishNotification(tx,{id:`demand:${alert.id}:${recipientId}`,institutionId:run.institutionId,recipientId,type:'demand',title:'Demanda prevista superior a la capacidad',body:`Semana del ${day}. Consulta el pronóstico actualizado y prepara los recursos.`,href:`/alertas/${alert.id}`,isDemo:run.source==='synthetic'});
   }
  });
 }
 async alerts(actor:CampusPrincipal,raw:unknown){
  requirePermission(actor,'reports:read:institution');const source=demandSource(object(raw).source);
  return {source,items:await this.db.demandAlert.findMany({where:{institutionId:actor.institutionId,source},orderBy:{weekStart:'desc'},take:100})};
 }
 async alert(actor:CampusPrincipal,id:string){
  requirePermission(actor,'reports:read:institution');const row=await this.db.demandAlert.findFirst({where:{id:uuid(id,'id'),institutionId:actor.institutionId}});if(!row)throw new NotFoundException();return row;
 }
 async review(actor:CampusPrincipal,id:string,raw:unknown){
  requirePermission(actor,'configuration:manage');const note=reason(object(raw)),alert=await this.alert(actor,id);
  return this.db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT "id" FROM "DemandAlert" WHERE "id"=${alert.id}::uuid FOR UPDATE`;
   const before=await tx.demandAlert.findUniqueOrThrow({where:{id:alert.id}});if(before.reviewedAt)return before;
   const row=await tx.demandAlert.update({where:{id:alert.id},data:{reviewedAt:new Date(),reviewedById:actor.id,reviewReason:note}});
   await tx.academicChange.create({data:{institutionId:actor.institutionId,actorId:actor.id,entityType:'demand-alert',entityId:alert.id,action:'review',reason:note,before:{reviewed:false},after:{reviewed:true,runId:row.runId}}});return row;
  });
 }
}
