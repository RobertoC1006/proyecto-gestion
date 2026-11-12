import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CampusPrincipal } from '../auth/auth.policy';
import { ConsentAcceptanceDto, ConsentVersionDto } from './consent.dto';

const notFound = () => new NotFoundException({ code: 'NOT_FOUND', message: 'El consentimiento no existe o no está disponible.' });

@Injectable()
export class ConsentService {
  constructor(private readonly db: PrismaService) {}

  private currentWhere() {
    return { active: true, effectiveAt: { lte: new Date() } };
  }

  async current() {
    const version = await this.db.consentVersion.findFirst({ where: this.currentWhere(), orderBy: [{ effectiveAt: 'desc' }, { version: 'desc' }] });
    return version ? this.toVersion(version) : null;
  }

  async mine(actor: CampusPrincipal) {
    const current = await this.db.consentVersion.findFirst({ where: this.currentWhere(), orderBy: [{ effectiveAt: 'desc' }, { version: 'desc' }] });
    const acceptance = current ? await this.db.consentAcceptance.findUnique({
      where: { userId_consentVersionId: { userId: actor.id, consentVersionId: current.id } },
      include: { consentVersion: true, user: { select: { displayName: true } } },
    }) : null;
    return { current: current ? this.toVersion(current) : null, acceptance: acceptance ? this.toAcceptance(acceptance) : null };
  }

  async accept(actor: CampusPrincipal) {
    const current = await this.db.consentVersion.findFirst({ where: this.currentWhere(), orderBy: [{ effectiveAt: 'desc' }, { version: 'desc' }] });
    if (!current) throw notFound();
    const existing = await this.db.consentAcceptance.findUnique({ where: { userId_consentVersionId: { userId: actor.id, consentVersionId: current.id } }, include: { consentVersion: true, user: { select: { displayName: true } } } });
    if (existing) return this.toAcceptance(existing);
    try {
      const created = await this.db.consentAcceptance.create({
        data: { institutionId: actor.institutionId, userId: actor.id, consentVersionId: current.id },
        include: { consentVersion: true, user: { select: { displayName: true } } },
      });
      return this.toAcceptance(created);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        const duplicate = await this.db.consentAcceptance.findUnique({ where: { userId_consentVersionId: { userId: actor.id, consentVersionId: current.id } }, include: { consentVersion: true, user: { select: { displayName: true } } } });
        if (duplicate) return this.toAcceptance(duplicate);
        throw new ConflictException({ code: 'CONFLICT', message: 'No se pudo confirmar el consentimiento.' });
      }
      throw error;
    }
  }

  private toVersion(value: { id: string; version: string; title: string; summary: string; effectiveAt: Date }): ConsentVersionDto {
    return { id: value.id, version: value.version, title: value.title, summary: value.summary, effectiveAt: value.effectiveAt.toISOString() };
  }

  private toAcceptance(value: { id: string; userId: string; acceptedAt: Date; consentVersion: { version: string }; user: { displayName: string } }): ConsentAcceptanceDto {
    return { id: value.id, userId: value.userId, displayName: value.user.displayName, version: value.consentVersion.version, acceptedAt: value.acceptedAt.toISOString() };
  }
}
