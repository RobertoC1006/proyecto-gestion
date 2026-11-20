import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AcademicDirectory, AcademicPrincipal, requireAdministrator, requireAcademicRead } from './academic.access';
import { contextualFactor } from '../tickets/priority';
import * as v from './academic.validation';

const missing = () => new NotFoundException({ code: 'NOT_FOUND', message: 'El recurso no existe o no está disponible.' });
const conflict = () => new ConflictException({ code: 'CONFLICT', message: 'El registro cambió o ya existe. Actualiza la información antes de continuar.' });
const eventRelations = { course: { select: { id: true, code: true, name: true } }, section: { select: { id: true, code: true, name: true } } } as const;
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

@Injectable()
export class AcademicService {
  constructor(@Inject(PrismaService) private readonly db: PrismaService,
    @Inject(AcademicDirectory) private readonly directory: AcademicDirectory) {}

  private async write<T>(action: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try { return await this.db.$transaction(action); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (['P2002', 'P2034'].includes(error.code)) throw conflict();
        if (['P2003', 'P2025'].includes(error.code)) throw missing();
      }
      throw error;
    }
  }
  private async record(tx: Prisma.TransactionClient, actor: AcademicPrincipal, entityType: string,
    entityId: string, action: string, reason: string, before?: unknown, after?: unknown) {
    await tx.academicChange.create({ data: { institutionId: actor.institutionId, actorId: actor.id,
      entityType, entityId, action, reason, before: before == null ? Prisma.DbNull : json(before),
      after: after == null ? Prisma.DbNull : json(after) } });
  }
  private async course(tx: Prisma.TransactionClient, institutionId: string, id: string) {
    const row = await tx.academicCourse.findFirst({ where: { id, institutionId } });
    if (!row) throw missing();
    return row;
  }
  private async section(tx: Prisma.TransactionClient, institutionId: string, id: string) {
    const row = await tx.academicSection.findFirst({ where: { id, institutionId } });
    if (!row) throw missing();
    return row;
  }

  async listCourses(actor: AcademicPrincipal, query: unknown) {
    if (!actor.permissions.includes('academic:manage')) {
      this.requireTeacher(actor);
      return this.personalCourses(actor, query);
    }
    const { page, pageSize } = v.listInput(query);
    const where = { institutionId: actor.institutionId };
    const [items, total] = await this.db.$transaction([
      this.db.academicCourse.findMany({ where, orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.db.academicCourse.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
  async createCourse(actor: AcademicPrincipal, input: unknown) {
    requireAdministrator(actor);
    const body = v.object(input), code = v.text(body.code, 'code', 40), name = v.text(body.name, 'name'), reason = v.reason(body);
    return this.write(async tx => {
      const row = await tx.academicCourse.create({ data: { institutionId: actor.institutionId, code, name } });
      await this.record(tx, actor, 'course', row.id, 'create', reason, null, row);
      return row;
    });
  }
  async listSections(actor: AcademicPrincipal, query: unknown) {
    if (!actor.permissions.includes('academic:manage')) {
      this.requireTeacher(actor);
      return this.personalSections(actor, query);
    }
    const { page, pageSize, courseId } = v.listInput(query);
    const where = { institutionId: actor.institutionId, courseId };
    const [items, total] = await this.db.$transaction([
      this.db.academicSection.findMany({ where, orderBy: [{ code: 'asc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.db.academicSection.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
  async personalCourses(actor: AcademicPrincipal, query: unknown) {
    requireAcademicRead(actor);
    const { page, pageSize } = v.personalCatalogInput(query);
    const where: Prisma.AcademicCourseWhereInput = {
      institutionId: actor.institutionId,
      sections: { some: { memberships: { some: { institutionId: actor.institutionId, subjectId: actor.id } } } },
    };
    const [items, total] = await this.db.$transaction([
      this.db.academicCourse.findMany({ where, orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.db.academicCourse.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
  async personalSections(actor: AcademicPrincipal, query: unknown) {
    requireAcademicRead(actor);
    const { page, pageSize, courseId } = v.personalCatalogInput(query, true);
    const where: Prisma.AcademicSectionWhereInput = {
      institutionId: actor.institutionId, courseId,
      memberships: { some: { institutionId: actor.institutionId, subjectId: actor.id } },
    };
    const [items, total] = await this.db.$transaction([
      this.db.academicSection.findMany({ where, orderBy: [{ code: 'asc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.db.academicSection.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
  async createSection(actor: AcademicPrincipal, input: unknown) {
    requireAdministrator(actor);
    const body = v.object(input), courseId = v.uuid(body.courseId, 'courseId'), code = v.text(body.code, 'code', 40), name = v.text(body.name, 'name'), reason = v.reason(body);
    return this.write(async tx => {
      await this.course(tx, actor.institutionId, courseId);
      const row = await tx.academicSection.create({ data: { institutionId: actor.institutionId, courseId, code, name } });
      await this.record(tx, actor, 'section', row.id, 'create', reason, null, row);
      return row;
    });
  }
  async associate(actor: AcademicPrincipal, input: unknown) {
    requireAdministrator(actor);
    const body = v.object(input), sectionId = v.uuid(body.sectionId, 'sectionId'), subjectId = v.uuid(body.subjectId, 'subjectId'), reason = v.reason(body);
    const section = await this.section(this.db, actor.institutionId, sectionId);
    if (!await this.directory.belongsToInstitution(subjectId, actor.institutionId)) throw missing();
    return this.write(async tx => {
      const existing = await tx.academicMembership.findUnique({ where: { sectionId_subjectId: { sectionId, subjectId } } });
      if (existing) return existing;
      const row = await tx.academicMembership.create({ data: { sectionId, subjectId, courseId: section.courseId, institutionId: actor.institutionId } });
      await this.record(tx, actor, 'membership', sectionId, 'create', reason, null, row);
      return row;
    });
  }
  async memberships(actor: AcademicPrincipal, query: unknown) {
    requireAdministrator(actor); const {page,pageSize,sectionId}=v.listInput(query);
    const where={institutionId:actor.institutionId,sectionId};
    const [items,total]=await this.db.$transaction([this.db.academicMembership.findMany({where,include:{section:{include:{course:true}}},orderBy:{createdAt:'asc'},take:pageSize,skip:(page-1)*pageSize}),this.db.academicMembership.count({where})]);
    const users=await this.db.appUser.findMany({where:{institutionId:actor.institutionId,id:{in:items.map(x=>x.subjectId)}},select:{id:true,displayName:true,role:true}});
    return {items:items.map(x=>({...x,user:users.find(u=>u.id===x.subjectId)})),total,page,pageSize};
  }
  async dissociate(actor: AcademicPrincipal, rawSection: string, rawSubject: string, input: unknown) {
    requireAdministrator(actor);
    const sectionId = v.uuid(rawSection, 'sectionId'), subjectId = v.uuid(rawSubject, 'subjectId'), reason = v.reason(v.object(input));
    return this.write(async tx => {
      await this.section(tx, actor.institutionId, sectionId);
      const row = await tx.academicMembership.findUnique({ where: { sectionId_subjectId: { sectionId, subjectId } } });
      if (!row) throw missing();
      await tx.academicMembership.delete({ where: { sectionId_subjectId: { sectionId, subjectId } } });
      await this.record(tx, actor, 'membership', sectionId, 'delete', reason, row);
      return { id: sectionId, deleted: true };
    });
  }
  async getEvent(actor: AcademicPrincipal, rawId: string) {
    if (!actor.permissions.includes('academic:manage')) this.requireTeacher(actor);
    const id = v.uuid(rawId, 'id');
    const row = await this.db.academicEvent.findFirst({ where: { id, institutionId: actor.institutionId }, include: eventRelations });
    if (!row) throw missing();
    if (!actor.permissions.includes('academic:manage')) await this.teacherScope(this.db, actor, row);
    return row;
  }
  async listEvents(actor: AcademicPrincipal, query: unknown) {
    if (!actor.permissions.includes('academic:manage')) { this.requireTeacher(actor); return this.eventList(actor, query, true); }
    return this.eventList(actor, query, false);
  }
  async applicableEvents(actor: AcademicPrincipal, query: unknown) {
    requireAcademicRead(actor);
    return this.eventList(actor, query, true);
  }
  private async eventList(actor: AcademicPrincipal, query: unknown, personal: boolean) {
    const q = v.listInput(query, true);
    const visibility: Prisma.AcademicEventWhereInput = personal ? { OR: [
      { scope: 'institution' },
      { scope: 'course', course: { sections: { some: { memberships: { some: { subjectId: actor.id } } } } } },
      { scope: 'section', section: { memberships: { some: { subjectId: actor.id } } } },
    ] } : {};
    const where: Prisma.AcademicEventWhereInput = { institutionId: actor.institutionId,
      startsAt: { lt: q.to }, endsAt: { gt: q.from }, type: q.type,
      AND: [visibility, ...(q.courseId ? [{ OR: [{ scope: 'institution' as const }, { courseId: q.courseId }] }] : []),
        ...(q.sectionId ? [{ OR: [{ scope: 'institution' as const }, { scope: 'course' as const, course: { sections: { some: { id: q.sectionId } } } }, { sectionId: q.sectionId }] }] : [])] };
    const [items, total] = await this.db.$transaction([
      this.db.academicEvent.findMany({ where, include: eventRelations, orderBy: [{ startsAt: 'asc' }, { id: 'asc' }], skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      this.db.academicEvent.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  }
  async saveEvent(actor: AcademicPrincipal, input: unknown, rawId?: string) {
    const admin = actor.permissions.includes('academic:manage');
    if (!admin) this.requireTeacher(actor);
    const { reason, ...data } = v.eventInput(input);
    const id = rawId == null ? undefined : v.uuid(rawId, 'id');
    const version = id ? v.positive(v.object(input).expectedVersion, 'expectedVersion') : undefined;
    return this.write(async tx => {
      if (!admin) await this.teacherScope(tx, actor, data);
      if (data.courseId) await this.course(tx, actor.institutionId, data.courseId);
      if (data.sectionId) {
        const section = await this.section(tx, actor.institutionId, data.sectionId);
        if (section.courseId !== data.courseId) v.invalid('sectionId', 'La sección no pertenece al curso.');
      }
      const before = id ? await tx.academicEvent.findFirst({ where: { id, institutionId: actor.institutionId } }) : null;
      if (id && !before) throw missing();
      if (!admin && before) {
        await this.teacherScope(tx, actor, before);
        if (before.createdById !== actor.id) throw missing();
      }
      let row;
      if (id) {
        const updated = await tx.academicEvent.updateMany({ where: { id, institutionId: actor.institutionId, version }, data: { ...data, version: { increment: 1 } } });
        if (updated.count !== 1) throw conflict();
        row = await tx.academicEvent.findUniqueOrThrow({ where: { id }, include: eventRelations });
      } else {
        row = await tx.academicEvent.create({ data: { ...data, institutionId: actor.institutionId, createdById: actor.id }, include: eventRelations });
      }
      await this.record(tx, actor, 'event', row.id, id ? 'update' : 'create', reason, before, row);
      return row;
    });
  }
  async deleteEvent(actor: AcademicPrincipal, rawId: string, input: unknown) {
    requireAdministrator(actor);
    const id = v.uuid(rawId, 'id'), body = v.object(input), version = v.positive(body.expectedVersion, 'expectedVersion'), reason = v.reason(body);
    return this.write(async tx => {
      const before = await tx.academicEvent.findFirst({ where: { id, institutionId: actor.institutionId } });
      if (!before) throw missing();
      const removed = await tx.academicEvent.deleteMany({ where: { id, institutionId: actor.institutionId, version } });
      if (removed.count !== 1) throw conflict();
      await this.record(tx, actor, 'event', id, 'delete', reason, before);
      return { id, deleted: true };
    });
  }
  private requireTeacher(actor: AcademicPrincipal) {
    if (actor.role !== 'docente' || !actor.permissions.includes('academic:teach')) throw new ForbiddenException({code:'FORBIDDEN',message:'No tienes permiso para programar actividades.'});
  }
  private async teacherScope(tx: Prisma.TransactionClient, actor: AcademicPrincipal, event: { scope: string; courseId: string | null; sectionId: string | null; type?: string }) {
    if (event.scope === 'institution' || !event.courseId || event.type === 'matricula') throw missing();
    const sections = await tx.academicSection.findMany({ where: { institutionId: actor.institutionId, courseId: event.courseId, ...(event.sectionId ? { id: event.sectionId } : {}) }, select: { id: true, memberships: { where: { subjectId: actor.id }, select: { subjectId: true } } } });
    if (!sections.length || sections.some(s => !s.memberships.length)) throw missing();
  }
  async context(institutionId: string, subjectId: string, courseId: string | null, sectionId: string | null, at: Date, tx: Prisma.TransactionClient = this.db) {
    const memberships = courseId ? await tx.academicMembership.findMany({ where: { institutionId, subjectId, courseId, ...(sectionId ? { sectionId } : {}) } }) : [];
    if (courseId && !memberships.length) v.invalid('courseId', 'El usuario no tiene una asociación académica vigente.');
    const events = await tx.academicEvent.findMany({ where: { institutionId, endsAt: { gt: at }, startsAt: { lt: new Date(at.getTime() + 172800000) }, OR: [
      { scope: 'institution' },
      ...(courseId ? [{ scope: 'course' as const, courseId }, { scope: 'section' as const, courseId, sectionId: { in: memberships.map(m => m.sectionId) } }] : []),
    ] }, select: { id: true, title: true, type: true, startsAt: true, endsAt: true } });
    return contextualFactor(events, at);
  }
  async personalContext(actor: AcademicPrincipal, raw: unknown) {
    requireAcademicRead(actor); const q = v.object(raw);
    return this.context(actor.institutionId, actor.id, q.courseId ? v.uuid(q.courseId, 'courseId') : null, q.sectionId ? v.uuid(q.sectionId, 'sectionId') : null, new Date());
  }

}
