import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AcademicService } from '../academic/academic.service';
import { CampusPrincipal, requirePermission } from '../auth/auth.policy';
import { RolePermissionsService } from '../auth/role-permissions.service';
import { invalid, object, positive, reason, text, uuid } from '../academic/academic.validation';
import { calculate, defaultRules, policyInput, Rule } from './priority';
import { ticketResponse } from './tickets.service';
import { ticketsQuery } from './tickets.validation';

const json = (v: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(v));
const conflict = () => new ConflictException({ code: 'CONFLICT', message: 'El ticket cambió. Actualiza antes de continuar.' });

@Injectable()
export class OperationsService {
 constructor(private readonly db: PrismaService, private readonly academic: AcademicService, private readonly permissions: RolePermissionsService) {}
 private read(actor: CampusPrincipal) { requirePermission(actor, 'tickets:read:institution'); }
 private async fresh(actor: CampusPrincipal, tx: Prisma.TransactionClient, permission: string) {
  const current = await tx.appUser.findFirst({ where: { id: actor.id, institutionId: actor.institutionId, active: true } });
  if (!current) throw new NotFoundException();
  requirePermission({ ...actor, ...current, permissions: await this.permissions.effective(actor.institutionId, current.role, tx) }, permission);
 }
 async policy(actor: CampusPrincipal, tx: Prisma.TransactionClient = this.db) {
  const row = await tx.workflowPolicy.findUnique({ where: { institutionId: actor.institutionId } });
  return { rules: row ? policyInput(row.rules) : defaultRules, version: row?.version ?? 0 };
 }
 async savePolicy(actor: CampusPrincipal, input: unknown) {
  requirePermission(actor, 'configuration:manage'); const b = object(input), rules = policyInput(b.rules), note = reason(b);
  const version = Number(b.expectedVersion);
  if (!Number.isInteger(version) || version < 0) invalid('expectedVersion', 'Versión no válida.');
  return this.db.$transaction(async tx => {
   await tx.$queryRaw`SELECT "id" FROM "Institution" WHERE "id"=${actor.institutionId}::uuid FOR UPDATE`;
   await this.fresh(actor, tx, 'configuration:manage');
   const before = await this.policy(actor, tx); if (version !== before.version) throw conflict();
   const row = await tx.workflowPolicy.upsert({ where: { institutionId: actor.institutionId }, create: { institutionId: actor.institutionId, rules: json(rules) }, update: { rules: json(rules), version: { increment: 1 } } });
   await tx.academicChange.create({ data: { institutionId: actor.institutionId, actorId: actor.id, entityType: 'workflow-policy', entityId: actor.institutionId, action: 'update', reason: note, before: json(before), after: json({ rules, version: row.version }) } });
   return { rules, version: row.version };
  });
 }
 async queue(actor: CampusPrincipal, input: unknown) {
  this.read(actor); const q = object(input), { page, pageSize, status, search } = ticketsQuery(q);
  const order = q.order ?? 'context'; if (!['context','technical','arrival'].includes(String(order))) invalid('order','Orden no válido.');
  const where: Prisma.TicketWhereInput = { institutionId: actor.institutionId, ...(status ? { status } : { status: { not: 'resuelto' } }), ...(search ? { OR: [{ code: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] } : {}) };
  const orderBy: Prisma.TicketOrderByWithRelationInput[] = order === 'arrival' ? [{ createdAt: 'asc' }, { id: 'asc' }] : [{ [order === 'technical' ? 'technicalScore' : 'score']: { sort: 'desc', nulls: 'last' } }, { createdAt: 'asc' }, { id: 'asc' }];
  const [items,total,summary] = await this.db.$transaction([
   this.db.ticket.findMany({ where, orderBy, skip:(page-1)*pageSize, take:pageSize, include:{ owner:{ select:{ displayName:true } }, course:{ select:{ name:true } } } }),
   this.db.ticket.count({ where }), this.db.ticket.groupBy({ by:['status'], orderBy:{status:'asc'}, where:{institutionId:actor.institutionId}, _count:true }),
  ]);
  return { items:items.map(t=>({...ticketResponse(t,true),ownerName:t.owner.displayName,courseName:t.course?.name})), total,page,pageSize,summary };
 }
 async detail(actor: CampusPrincipal, rawId: string) {
  this.read(actor); const id = uuid(rawId,'id');
  const row = await this.db.ticket.findFirst({ where:{ id,institutionId:actor.institutionId }, include:{owner:{select:{displayName:true}},course:{select:{name:true}},changes:{orderBy:[{createdAt:'asc'},{id:'asc'}]} } });
  if (!row) throw new NotFoundException({ code:'NOT_FOUND',message:'No se encontró la incidencia.' });
  const assignee = row.assigneeId ? await this.db.appUser.findUnique({where:{id:row.assigneeId},select:{displayName:true}}) : null;
  return {...ticketResponse(row,true),ownerName:row.owner.displayName,courseName:row.course?.name,assigneeName:assignee?.displayName,changes:row.changes.map(c=>({id:c.id,action:c.action,note:c.note,createdAt:c.createdAt.toISOString()}))};
 }
 async action(actor: CampusPrincipal, rawId: string, input: unknown) {
  requirePermission(actor,'tickets:work:institution'); const id=uuid(rawId,'id'), b=object(input), version=positive(b.expectedVersion,'expectedVersion'), note=text(b.note,'note',2000,5);
  if (!['evaluate','start','note','resolve','assign'].includes(String(b.action))) invalid('action','Acción no válida.');
  return this.db.$transaction(async tx=>{
   await this.fresh(actor,tx,'tickets:work:institution');
   await tx.$queryRaw`SELECT "id" FROM "Ticket" WHERE "id"=${id}::uuid AND "institutionId"=${actor.institutionId}::uuid FOR UPDATE`;
   const before=await tx.ticket.findFirst({where:{id,institutionId:actor.institutionId}});
   if (!before) throw new NotFoundException(); if (before.version!==version) throw conflict();
   if (before.status==='resuelto') invalid('action','La incidencia ya está resuelta.');
   const now=new Date(); let patch: Prisma.TicketUncheckedUpdateManyInput={ version:{increment:1} };
   if (b.action==='evaluate') {
    const urgency=positive(b.urgency,'urgency',3), impact=positive(b.impact,'impact',3);
    const context=await this.academic.context(actor.institutionId,before.ownerId,before.courseId,before.sectionId,before.createdAt,tx);
    const policy=await this.policy(actor,tx); const calc=calculate(urgency,impact,context.factor,policy.rules);
    // Los plazos siempre parten del registro; reevaluar nunca reinicia el reloj.
    patch={...patch,urgency,impact,academicFactor:context.factor,academicContext:json(context),technicalScore:calc.technicalScore,score:calc.score,priority:calc.rule.priority,policyVersion:policy.version,classificationStatus:'manual',responseDueAt:new Date(before.createdAt.getTime()+calc.rule.responseMinutes*60000),resolutionDueAt:new Date(before.createdAt.getTime()+calc.rule.resolutionMinutes*60000)};
   } else if (b.action==='assign') {
    const assigneeId=uuid(b.assigneeId,'assigneeId'); const user=await tx.appUser.findFirst({where:{id:assigneeId,institutionId:actor.institutionId,active:true}});
    if (!user || !(await this.permissions.effective(actor.institutionId,user.role,tx)).includes('tickets:work:institution')) invalid('assigneeId','Selecciona un encargado de TI activo de esta institución.');
    patch.assigneeId=assigneeId;
   } else if (b.action==='start') {
    if (!before.priority || before.status!=='registrado') invalid('action','Evalúa la prioridad antes de iniciar la atención.');
    patch={...patch,status:'en_atencion',assigneeId:actor.id,firstResponseAt:before.firstResponseAt??now};
   } else if (b.action==='note' && before.status!=='en_atencion') {
    invalid('action','Inicia la atención antes de registrar avances.');
   } else if (b.action==='resolve') {
    if (before.status!=='en_atencion') invalid('action','Inicia la atención antes de resolver.');
    if (typeof b.failureConfirmed!=='boolean') invalid('failureConfirmed','Indica si se confirmó una falla tecnológica.');
    patch={...patch,status:'resuelto',solution:text(b.solution,'solution',5000,10),failureConfirmed:b.failureConfirmed,resolvedAt:now};
   }
   const result=await tx.ticket.updateMany({where:{id,institutionId:actor.institutionId,version},data:patch}); if (result.count!==1) throw conflict();
   const after=await tx.ticket.findUniqueOrThrow({where:{id}});
   await tx.ticketChange.create({data:{ticketId:id,institutionId:actor.institutionId,actorId:actor.id,action:String(b.action),note,before:json(ticketResponse(before,true)),after:json(ticketResponse(after,true))}});
   return ticketResponse(after,true);
  });
 }
}
