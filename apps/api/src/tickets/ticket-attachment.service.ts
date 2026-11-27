import { ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma, TicketAttachment } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { CampusPrincipal } from '../auth/auth.policy';
import { PrismaService } from '../database/prisma.service';
import { uuid } from '../academic/academic.validation';
import { evidenceInput } from './ticket-attachment.validation';
import { TicketAttachmentStorage } from './ticket-attachment.storage';

const response = (item: TicketAttachment) => ({ id: item.id, ticketId: item.ticketId,
  originalName: item.originalName, mimeType: item.mimeType, sizeBytes: item.sizeBytes,
  sha256: item.sha256, createdAt: item.createdAt.toISOString() });

@Injectable()
export class TicketAttachmentService {
  private activeUploads = 0;
  constructor(private readonly db: PrismaService, private readonly storage: TicketAttachmentStorage) {}

  private async ownTicket(principal: CampusPrincipal, rawId: unknown) {
    const ticketId = uuid(rawId, 'ticketId');
    const ticket = await this.db.ticket.findFirst({ where: { id: ticketId,
      institutionId: principal.institutionId, ownerId: principal.id }, select: { id: true } });
    if (!ticket) throw new NotFoundException({ code: 'NOT_FOUND', message: 'No se encontró el ticket.' });
    return ticketId;
  }

  async attach(principal: CampusPrincipal, rawId: unknown, rawBody: unknown) {
    const ticketId = await this.ownTicket(principal, rawId);
    if (this.activeUploads >= 4) throw new ServiceUnavailableException({ code: 'DEPENDENCY_UNAVAILABLE', message: 'Hay demasiadas cargas simultáneas. Reintenta el mismo archivo.' });
    this.activeUploads++;
    try { return await this.attachLimited(principal, ticketId, rawBody); }
    finally { this.activeUploads--; }
  }

  private async attachLimited(principal: CampusPrincipal, ticketId: string, rawBody: unknown) {
    const input = await evidenceInput(rawBody);
    let uploadedKey: string | undefined;
    try {
      const result = await this.db.$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "Ticket" WHERE "id" = ${ticketId}::uuid AND "institutionId" = ${principal.institutionId}::uuid AND "ownerId" = ${principal.id}::uuid FOR UPDATE`;
        const existing = await tx.ticketAttachment.findUnique({ where: { ticketId } });
        if (existing) {
          if (existing.sha256 === input.sha256 && existing.sizeBytes === input.bytes.length &&
              existing.mimeType === input.mimeType && existing.originalName === input.originalName) {
            await this.verifiedBytes(existing);
            return { created: false, item: existing };
          }
          throw new ConflictException({ code: 'ATTACHMENT_ALREADY_EXISTS', message: 'Este reporte ya tiene otra evidencia.' });
        }
        const key = randomBytes(32).toString('base64url');
        await this.storage.put(key, input.bytes, input.mimeType);
        uploadedKey = key;
        const item = await tx.ticketAttachment.create({ data: { ticketId, storageKey: key,
          originalName: input.originalName, mimeType: input.mimeType, sizeBytes: input.bytes.length, sha256: input.sha256 } });
        return { created: true, item };
      }, { timeout: 20000, maxWait: 5000 });
      return { created: result.created, attachment: response(result.item) };
    } catch (error) {
      if (uploadedKey) {
        // Tras COMMIT incierto, conservar siempre un objeto que ya tenga metadatos.
        try {
          const linked = await this.db.ticketAttachment.findUnique({ where: { storageKey: uploadedKey } });
          if (!linked) await this.storage.remove(uploadedKey);
        } catch { /* Si no se pudo confirmar la ausencia, dejar el objeto para reconciliación explícita. */ }
      }
      if (error instanceof ConflictException || error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException({ code: 'DEPENDENCY_UNAVAILABLE', message: 'No se pudo guardar la evidencia. El ticket permanece registrado.' });
    }
  }

  private async item(principal: CampusPrincipal, rawId: unknown) {
    const ticketId = await this.ownTicket(principal, rawId);
    const item = await this.db.ticketAttachment.findUnique({ where: { ticketId } });
    if (!item) throw new NotFoundException({ code: 'ATTACHMENT_NOT_FOUND', message: 'El ticket no tiene evidencia.' });
    return item;
  }
  private async verifiedBytes(item: TicketAttachment) {
    const bytes = await this.storage.get(item.storageKey);
    const hash = createHash('sha256').update(bytes).digest('hex');
    if (bytes.length !== item.sizeBytes || hash !== item.sha256) throw new ServiceUnavailableException({ code: 'DEPENDENCY_UNAVAILABLE', message: 'La evidencia no supera la comprobación de integridad.' });
    return bytes;
  }
  async metadata(principal: CampusPrincipal, rawId: unknown) {
    const item = await this.item(principal, rawId);
    await this.verifiedBytes(item);
    return response(item);
  }
  async download(principal: CampusPrincipal, rawId: unknown) {
    const item = await this.item(principal, rawId);
    return { metadata: response(item), bytes: await this.verifiedBytes(item) };
  }
}
