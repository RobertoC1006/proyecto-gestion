import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { CampusPrincipal, requirePermission } from '../auth/auth.policy';
import { object, uuid, invalid } from '../academic/academic.validation';
import { OperationsService } from './operations.service';

@Injectable()
export class DemoService {
 constructor(private readonly db:PrismaService,private readonly operations:OperationsService) {}
 async prepare(actor:CampusPrincipal,input:unknown) {
  requirePermission(actor,'configuration:manage');requirePermission(actor,'tickets:work:institution');
  const b=object(input),studentId=uuid(b.studentId,'studentId');
  const professorId=b.professorId?uuid(b.professorId,'professorId'):null;
  const now=new Date();
  const created=await this.db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT "id" FROM "Institution" WHERE "id"=${actor.institutionId}::uuid FOR UPDATE`;
   const student=await tx.appUser.findFirst({where:{id:studentId,institutionId:actor.institutionId,active:true,role:'estudiante'}});
   if(!student) invalid('studentId','Selecciona una cuenta estudiante activa.');
   if(professorId&&!await tx.appUser.findFirst({where:{id:professorId,institutionId:actor.institutionId,active:true,role:'docente'}})) invalid('professorId','Selecciona una cuenta profesor activa.');
   // Una preparación por institución y estudiante. Repetir no duplica ni reinicia relojes.
   const existing=await tx.ticket.findMany({where:{institutionId:actor.institutionId,ownerId:studentId,isDemo:true},orderBy:{createdAt:'asc'}});
   if(existing.length) return existing;
   const courses=[];
   for(const [code,name] of [['DEMO-RED','Redes I · Caso práctico'],['DEMO-PRO','Programación II · Caso práctico']]){
    const course=await tx.academicCourse.upsert({where:{institutionId_code:{institutionId:actor.institutionId,code}},update:{},create:{institutionId:actor.institutionId,code,name}});
    const section=await tx.academicSection.upsert({where:{courseId_code:{courseId:course.id,code:'DEMO-A'}},update:{},create:{institutionId:actor.institutionId,courseId:course.id,code:'DEMO-A',name:'Sección A · Demostración'}});
    for(const subjectId of [studentId,...(professorId?[professorId]:[])]) await tx.academicMembership.upsert({where:{sectionId_subjectId:{sectionId:section.id,subjectId}},update:{},create:{institutionId:actor.institutionId,courseId:course.id,sectionId:section.id,subjectId}});
    courses.push({course,section});
   }
   for(const [i,type,title,minutes] of [[0,'examen','Parcial de Redes I · Demostración',30],[1,'entrega','Entrega de proyecto · Demostración',720]] as const){
    const e=await tx.academicEvent.create({data:{institutionId:actor.institutionId,courseId:courses[i].course.id,sectionId:courses[i].section.id,scope:'section',type,title,createdById:professorId??actor.id,startsAt:new Date(now.getTime()+minutes*60000),endsAt:new Date(now.getTime()+(minutes+120)*60000)}});
    await tx.academicChange.create({data:{institutionId:actor.institutionId,actorId:actor.id,entityType:'event',entityId:e.id,action:'create',reason:'Preparación explícita del caso práctico con datos de demostración.',after:{title}}});
   }
   const samples=[
    {description:'T1 · Demostración: no puedo entrar al aula virtual y mi examen empieza en 30 minutos.',service:'aula_virtual' as const,scope:'curso' as const,...courses[0]},
    {description:'T2 · Demostración: red caída en el laboratorio B; 40 estudiantes afectados, sin evaluación.',service:'wifi_red' as const,scope:'general' as const},
    {description:'T3 · Demostración: error al subir la tarea del proyecto que vence hoy.',service:'aula_virtual' as const,scope:'curso' as const,...courses[1]},
    {description:'T4 · Demostración: el correo institucional no se sincroniza en mi celular.',service:'correo' as const,scope:'general' as const},
   ];const tickets=[];
   for(const sample of samples){
    const ticket=await tx.ticket.create({data:{institutionId:actor.institutionId,ownerId:studentId,description:sample.description,service:sample.service,scope:sample.scope,courseId:'course' in sample?sample.course.id:null,sectionId:'section' in sample?sample.section.id:null,code:`INC-${now.getUTCFullYear()}-${randomBytes(12).toString('hex').toUpperCase()}`,idempotencyKey:randomUUID(),requestHash:createHash('sha256').update(sample.description).digest('hex'),isDemo:true,createdAt:now}});
    await tx.ticketChange.create({data:{institutionId:actor.institutionId,ticketId:ticket.id,actorId:actor.id,action:'demo.created',note:'Caso sintético preparado por administración para demostrar el flujo. No es un reporte real.'}});tickets.push(ticket);
   }return tickets;
  },{timeout:20000});
  const scales=[[3,2],[3,3],[2,2],[2,1]];
  for(let i=0;i<created.length;i++){
   const t=created[i];const index=/T([1-4])/.exec(t.description);
   if(!t.priority&&index){const [urgency,impact]=scales[Number(index[1])-1];await this.operations.action(actor,t.id,{action:'evaluate',urgency,impact,expectedVersion:t.version,note:'Evaluación técnica manual del escenario de demostración.'});}
  }
  return {message:'Caso preparado. Los reportes están identificados como demostración.',count:created.length};
 }
}
