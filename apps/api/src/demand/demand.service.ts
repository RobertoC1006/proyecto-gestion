import { ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CampusPrincipal, requirePermission } from '../auth/auth.policy';
import { invalid, object, positive, reason } from '../academic/academic.validation';
import { addDays, Day, DemandResult, limaDay, Source } from './demand.types';
const json = (x: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(x));
export function demandSource(raw: unknown): Source {
 if (raw == null || raw === '') return 'operational';
 if (raw !== 'synthetic' && raw !== 'operational') invalid('source','Selecciona datos reales o sintéticos.');
 return raw;
}
@Injectable()
export class DemandService {
 constructor(private readonly db: PrismaService) {}
 read(actor: CampusPrincipal) { requirePermission(actor, 'reports:read:institution'); }
 async config(actor: CampusPrincipal) {
  this.read(actor); return await this.db.demandConfig.findUnique({where:{institutionId:actor.institutionId}}) || {weeklyCapacity:350,observedFrom:null,version:0};
 }
 async saveConfig(actor: CampusPrincipal, raw: unknown) {
  requirePermission(actor,'configuration:manage'); const b=object(raw),capacity=positive(b.weeklyCapacity,'weeklyCapacity',1000000),note=reason(b);
  const version=b.expectedVersion; if(typeof version!=='number'||!Number.isInteger(version)||version<0) invalid('expectedVersion','Versión no válida.');
  let observedFrom: Date|null = null;
  if(b.observedFrom) {
   if(typeof b.observedFrom!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.observedFrom)||limaDay()<b.observedFrom||new Date(b.observedFrom).toISOString().slice(0,10)!==b.observedFrom) invalid('observedFrom','Selecciona una fecha observada válida, no futura.');
   observedFrom=new Date(b.observedFrom);
  }
  return this.db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT "id" FROM "Institution" WHERE "id"=${actor.institutionId}::uuid FOR UPDATE`;
   const before=await tx.demandConfig.findUnique({where:{institutionId:actor.institutionId}});
   if((before?.version??0)!==version)throw new ConflictException({code:'CONFLICT',message:'La configuración cambió. Actualiza la página.'});
   // La cobertura declarada no precede al primer registro disponible: no inventar ceros anteriores.
   const first=await tx.ticket.findFirst({where:{institutionId:actor.institutionId,isDemo:false},orderBy:{createdAt:'asc'},select:{createdAt:true}});
   if(observedFrom && (!first || limaDay(first.createdAt)>observedFrom.toISOString().slice(0,10))) invalid('observedFrom','La cobertura no puede preceder al primer registro real disponible.');
   const row=await tx.demandConfig.upsert({where:{institutionId:actor.institutionId},create:{institutionId:actor.institutionId,weeklyCapacity:capacity,observedFrom},update:{weeklyCapacity:capacity,observedFrom,version:{increment:1}}});
   await tx.academicChange.create({data:{institutionId:actor.institutionId,actorId:actor.id,entityType:'demand-config',entityId:actor.institutionId,action:'update',reason:note,before:before?json(before):Prisma.DbNull,after:json(row)}});
   return row;
  });
 }
 async queue(actor: CampusPrincipal, raw: unknown) {
  requirePermission(actor,'configuration:manage'); const b=object(raw),source=demandSource(b.source),kind=b.kind??'forecast';
  if(kind!=='forecast'&&kind!=='evaluate')invalid('kind','Operación no válida.');
  return this.ensure(actor.institutionId,source,kind,`manual:${limaDay()}`,limaDay());
 }
 async ensure(institutionId:string,source:Source,kind:'forecast'|'evaluate',slot:string,origin:string) {
  return this.db.forecastRun.upsert({where:{institutionId_source_kind_slot:{institutionId,source,kind,slot}},create:{institutionId,source,kind,slot,origin:new Date(origin)},update:{}});
 }
 async snapshot(actor:CampusPrincipal,raw:unknown) {
  this.read(actor); const source=demandSource(object(raw).source),where={institutionId:actor.institutionId,source};
  const [latest,lastGood,config]=await Promise.all([
   this.db.forecastRun.findFirst({where,orderBy:[{createdAt:'desc'},{id:'desc'}]}),
   this.db.forecastRun.findFirst({where:{...where,status:'completed'},orderBy:[{origin:'desc'},{finishedAt:'desc'}]}),this.config(actor)]);
  const selected=lastGood??latest; const result=selected?.result as unknown as DemandResult|null;
  return {source,config,latest:latest&&{id:latest.id,status:latest.status,errorCode:latest.errorCode,createdAt:latest.createdAt,finishedAt:latest.finishedAt},
   runId:selected?.id??null,generatedAt:selected?.finishedAt??null,result,stale:!!lastGood&&(latest?.status==='failed'||(result?.origin??'')<limaDay()),
   status:result?.status??(latest?.status==='failed'?'failed':latest?.status??'not_generated')};
 }
 async observed(institutionId:string,origin:string) {
  const config=await this.db.demandConfig.findUnique({where:{institutionId}});
  if(!config?.observedFrom)return {observed:[] as Day[],events:[]};
  const start=config.observedFrom.toISOString().slice(0,10),from=start>addDays(origin,-1095)?start:addDays(origin,-1095);
  const counts=await this.db.$queryRaw<{day:string;count:bigint}[]>`SELECT to_char("createdAt" AT TIME ZONE 'America/Lima','YYYY-MM-DD') AS day,count(*) AS count FROM "Ticket" WHERE "institutionId"=${institutionId}::uuid AND "isDemo"=false AND "createdAt">=${new Date(from+'T00:00:00-05:00')} AND "createdAt"<${new Date(origin+'T00:00:00-05:00')} GROUP BY day ORDER BY day`;
  const lookup=new Map(counts.map(r=>[r.day,Number(r.count)])),observed:Day[]=[];
  for(let day=from;day<origin;day=addDays(day,1))observed.push({date:day,count:lookup.get(day)??0});
  const calendar=await this.db.academicEvent.findMany({where:{institutionId,startsAt:{lt:new Date(addDays(origin,14)+'T00:00:00-05:00')},endsAt:{gt:new Date(from+'T00:00:00-05:00')}},select:{type:true,startsAt:true,endsAt:true,createdAt:true,updatedAt:true}});
  const events=[];
  for(const e of calendar)for(let day=limaDay(e.startsAt);day<=limaDay(new Date(e.endsAt.getTime()-1));day=addDays(day,1)){
   if(day>=from&&day<addDays(origin,14))events.push({date:day,type:e.type,availableAt:(e.updatedAt>e.createdAt?e.updatedAt:e.createdAt).toISOString()});
   if(events.length>15000)throw new ServiceUnavailableException({code:'CALENDAR_LIMIT',message:'Reduce el intervalo de observación.'});
  }
  return {observed,events};
 }
 async execute(id:string) {
  const run=await this.db.forecastRun.findUnique({where:{id}}); if(!run||run.status==='completed'||run.status==='unavailable')return;
  await this.db.forecastRun.update({where:{id},data:{status:'running',attempts:{increment:1},errorCode:null}});
  try {
   const origin=run.origin.toISOString().slice(0,10),source=demandSource(run.source);
   const data=source==='operational'?await this.observed(run.institutionId,origin):{observed:[],events:[]};
   const previous=await this.db.forecastRun.findFirst({where:{institutionId:run.institutionId,source,kind:'evaluate',status:'completed',origin:{lte:run.origin}},orderBy:{finishedAt:'desc'}});
   const response=await fetch(`${process.env.PREDICTIONS_URL||'http://predictions:8000'}/v1/run`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({runId:id,source,kind:run.kind,origin,...data,evaluation:(previous?.result as unknown as DemandResult|null)?.evaluation}),signal:AbortSignal.timeout(180000)});
   if(!response.ok)throw new Error('PYTHON_UNAVAILABLE');
   const result=await response.json() as DemandResult;
   if(result.source!==source||result.origin!==origin||!['available','unavailable'].includes(result.status)||result.forecast.some(p=>!Number.isFinite(p.value)||p.value<0))throw new Error('INVALID_RESULT');
   await this.db.forecastRun.update({where:{id},data:{status:result.status==='available'?'completed':'unavailable',result:json(result),finishedAt:new Date()}});
  }catch{
   await this.db.forecastRun.update({where:{id},data:{status:'failed',errorCode:'PREDICTIONS_FAILED',finishedAt:new Date()}});
   throw new ServiceUnavailableException('PREDICTIONS_FAILED');
  }
 }
}
