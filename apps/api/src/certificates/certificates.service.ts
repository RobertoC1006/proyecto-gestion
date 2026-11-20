import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TicketService } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { CampusPrincipal } from '../auth/auth.policy';
import { PrismaService } from '../database/prisma.service';
import { uuid } from '../academic/academic.validation';

export const certificateServiceLabels: Record<TicketService, string> = {
  aula_virtual: 'Aula virtual',
  wifi_red: 'Wi-Fi/red',
  correo: 'Correo institucional',
  equipos: 'Equipo de cómputo',
  impresoras: 'Impresora',
  cuentas_accesos: 'Cuentas y accesos',
  videoconferencia: 'Videoconferencia',
  sistemas_institucionales: 'Sistemas institucionales',
  almacenamiento_nube: 'Almacenamiento/nube',
  software_licencias: 'Software/licencias',
  otro: 'Otro servicio',
};

type CertificateRecord = {
  id: string;
  institutionId: string;
  ticketId: string;
  ownerId: string;
  code: string;
  ticketCode: string;
  service: TicketService;
  resolvedAt: Date;
  issuedAt: Date;
  sha256: string;
  storageKey: string;
};

const validCode = (value: unknown) => typeof value === 'string' && /^CITS-[A-Z0-9]{20}$/.test(value);

@Injectable()
export class CertificatesService {
  constructor(private readonly db: PrismaService) {}

  private filesDir() {
    return resolve(process.env.FILES_DIR || join(process.cwd(), 'files'));
  }

  private storagePath(storageKey: string) {
    const root = this.filesDir();
    const full = resolve(root, storageKey);
    if (full !== root && !full.startsWith(root + sep)) throw new Error('Ruta de archivo fuera del almacenamiento permitido.');
    return full;
  }

  private response(row: CertificateRecord) {
    return {
      id: row.id,
      code: row.code,
      ticketId: row.ticketId,
      ticketCode: row.ticketCode,
      service: row.service,
      resolvedAt: row.resolvedAt.toISOString(),
      issuedAt: row.issuedAt.toISOString(),
      sha256: row.sha256,
      status: 'emitida' as const,
    };
  }

  async mine(actor: CampusPrincipal) {
    const [tickets, issued] = await Promise.all([
      this.db.ticket.findMany({
        where: { institutionId: actor.institutionId, ownerId: actor.id, status: 'resuelto', failureConfirmed: true },
        include: { certificate: true },
        orderBy: [{ resolvedAt: 'desc' }, { id: 'desc' }],
      }),
      this.db.certificate.findMany({
        where: { institutionId: actor.institutionId, ownerId: actor.id },
        orderBy: [{ issuedAt: 'desc' }, { id: 'desc' }],
      }),
    ]);
    return {
      eligible: tickets.map(ticket => ({
        ticketId: ticket.id,
        ticketCode: ticket.code,
        service: ticket.service,
        resolvedAt: ticket.resolvedAt!.toISOString(),
        eligible: true as const,
        certificate: ticket.certificate ? this.response(ticket.certificate) : null,
      })),
      issued: issued.map(row => this.response(row)),
    };
  }

  async issue(actor: CampusPrincipal, rawTicketId: unknown) {
    const ticketId = uuid(rawTicketId, 'ticketId');
    const existing = await this.db.certificate.findFirst({ where: { institutionId: actor.institutionId, ticketId, ownerId: actor.id } });
    if (existing) {
      await this.ensurePdf(existing);
      return this.response(existing);
    }

    try {
      const issuedAt = new Date();
      let generated: Buffer | null = null;
      const row = await this.db.$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "Ticket" WHERE "id"=${ticketId}::uuid AND "institutionId"=${actor.institutionId}::uuid AND "ownerId"=${actor.id}::uuid FOR UPDATE`;
        const ticket = await tx.ticket.findFirst({
          where: { id: ticketId, institutionId: actor.institutionId, ownerId: actor.id },
          include: { owner: { select: { displayName: true } } },
        });
        if (!ticket) throw new NotFoundException({ code: 'CERTIFICATE_NOT_ELIGIBLE', message: 'El ticket no está disponible para emitir una constancia.' });
        if (ticket.status !== 'resuelto' || !ticket.failureConfirmed || !ticket.resolvedAt) {
          throw new ConflictException({ code: 'CERTIFICATE_NOT_ELIGIBLE', message: 'La constancia requiere un ticket resuelto y una falla confirmada.' });
        }
        const current = await tx.certificate.findUnique({ where: { ticketId } });
        if (current) return current;
        const institution = await tx.institution.findUnique({ where: { id: actor.institutionId }, select: { name: true } });

        const code = `CITS-${randomBytes(10).toString('hex').toUpperCase()}`;
        const storageKey = `certificates/${actor.institutionId}/${ticketId}.pdf`;
        const pdf = await this.createPdf({
          code,
          ticketCode: ticket.code,
          service: ticket.service,
          ownerName: ticket.owner.displayName,
          resolvedAt: ticket.resolvedAt,
          issuedAt,
          institutionId: actor.institutionId,
          institutionName: institution?.name,
          ticketCreatedAt: ticket.createdAt,
        });
        const sha256 = createHash('sha256').update(pdf).digest('hex');
        generated = pdf;
        return tx.certificate.create({
          data: {
            institutionId: actor.institutionId,
            ticketId,
            ownerId: actor.id,
            code,
            ticketCode: ticket.code,
            service: ticket.service,
            resolvedAt: ticket.resolvedAt,
            issuedAt,
            sha256,
            storageKey,
          },
        });
      });
      if (generated) await this.writePdf(row, generated);
      await this.ensurePdf(row);
      return this.response(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const winner = await this.db.certificate.findUnique({ where: { ticketId } });
        if (winner) {
          await this.ensurePdf(winner);
          return this.response(winner);
        }
      }
      throw error;
    }
  }

  async detail(actor: CampusPrincipal, rawId: unknown) {
    const id = uuid(rawId, 'id');
    const row = await this.db.certificate.findFirst({ where: { id, institutionId: actor.institutionId, ownerId: actor.id } });
    if (!row) throw new NotFoundException({ code: 'NOT_FOUND', message: 'No se encontró la constancia.' });
    await this.ensurePdf(row);
    return this.response(row);
  }

  async download(actor: CampusPrincipal, rawId: unknown) {
    const id = uuid(rawId, 'id');
    const row = await this.db.certificate.findFirst({ where: { id, institutionId: actor.institutionId, ownerId: actor.id } });
    if (!row) throw new NotFoundException({ code: 'NOT_FOUND', message: 'No se encontró la constancia.' });
    const path = await this.ensurePdf(row);
    return { path, bytes: await readFile(path), code: row.code };
  }

  async publicLookup(rawCode: unknown) {
    const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
    if (!validCode(code)) throw new NotFoundException({ code: 'CERTIFICATE_NOT_FOUND', message: 'No existe una constancia para el código indicado.' });
    const row = await this.db.certificate.findUnique({
      where: { code },
      include: { owner: { select: { displayName: true } } },
    });
    if (!row) throw new NotFoundException({ code: 'CERTIFICATE_NOT_FOUND', message: 'No existe una constancia para el código indicado.' });
    return {
      code: row.code,
      holder: this.maskName(row.owner.displayName),
      service: certificateServiceLabels[row.service],
      resolvedAt: row.resolvedAt.toISOString(),
      issuedAt: row.issuedAt.toISOString(),
      status: 'valida',
    };
  }

  async verifyPdf(rawCode: unknown, pdfBase64: unknown) {
    const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
    const row = validCode(code) ? await this.db.certificate.findUnique({ where: { code } }) : null;
    if (!row) throw new NotFoundException({ code: 'CERTIFICATE_NOT_FOUND', message: 'No existe una constancia para el código indicado.' });
    if (typeof pdfBase64 !== 'string' || pdfBase64.length > 7_000_000) {
      await this.recordVerification(row, 'archivo_no_verificable');
      throw new ConflictException({ code: 'FILE_NOT_VERIFIABLE', message: 'El archivo no pudo verificarse.' });
    }
    let bytes: Buffer;
    try {
      bytes = Buffer.from(pdfBase64, 'base64');
      if (bytes.length < 4 || bytes.length > 5_242_880 || bytes.subarray(0, 4).toString('ascii') !== '%PDF') throw new Error('invalid-pdf');
    } catch {
      await this.recordVerification(row, 'archivo_no_verificable');
      throw new ConflictException({ code: 'FILE_NOT_VERIFIABLE', message: 'El archivo no pudo verificarse.' });
    }
    const actual = createHash('sha256').update(bytes).digest('hex');
    const result = actual === row.sha256 ? 'valida' : 'alterado';
    await this.recordVerification(row, result);
    return {
      code: row.code,
      status: result,
      sha256Matches: result === 'valida',
    };
  }

  private async recordVerification(row: CertificateRecord, result: 'valida' | 'alterado' | 'archivo_no_verificable') {
    await this.db.certificateVerification.create({
      data: { institutionId: row.institutionId, certificateId: row.id, code: row.code, result },
    });
  }

  private maskName(name: string) {
    const first = name.trim().split(/\s+/)[0] || 'Titular';
    return `${first.charAt(0).toLocaleUpperCase('es-PE')}***`;
  }

  private async writePdf(row: CertificateRecord, bytes: Buffer) {
    const path = this.storagePath(row.storageKey);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes, { flag: 'w', mode: 0o600 });
  }

  private async ensurePdf(row: CertificateRecord) {
    const path = this.storagePath(row.storageKey);
    try {
      const info = await stat(path);
      if (info.isFile()) {
        const bytes = await readFile(path);
        if (createHash('sha256').update(bytes).digest('hex') === row.sha256) return path;
      }
    } catch {}
    const [institution, ticket] = await Promise.all([
      this.db.institution.findUnique({ where: { id: row.institutionId }, select: { name: true } }),
      this.db.ticket.findUnique({ where: { id: row.ticketId }, include: { owner: { select: { displayName: true } } } }),
    ]);
    const bytes = await this.createPdf({
      code: row.code,
      ticketCode: row.ticketCode,
      service: row.service,
      ownerName: ticket?.owner.displayName || 'Titular institucional',
      resolvedAt: row.resolvedAt,
      issuedAt: row.issuedAt,
      institutionId: row.institutionId,
      institutionName: institution?.name,
      ticketCreatedAt: ticket?.createdAt,
    });
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    await this.writePdf(row, bytes);
    await this.db.certificate.update({ where: { id: row.id }, data: { sha256 } });
    row.sha256 = sha256;
    return path;
  }

  private async createPdf(input: {
    code: string;
    ticketCode: string;
    service: TicketService;
    ownerName: string;
    resolvedAt: Date;
    issuedAt: Date;
    institutionId: string;
    institutionName?: string;
    ticketCreatedAt?: Date;
  }) {
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Constancia CampusITSM ${input.code}`);
    pdf.setAuthor(input.institutionName || 'CampusITSM');
    pdf.setSubject('Constancia de atención de incidencia');
    pdf.setCreator('CampusITSM');
    const page = pdf.addPage([595.28, 841.89]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const qrUrl = `${(process.env.APP_ORIGIN || 'http://localhost:8080').replace(/\/$/, '')}/verificar/${encodeURIComponent(input.code)}`;
    const qrPng = await QRCode.toBuffer(qrUrl, { type: 'png', width: 180, margin: 1, errorCorrectionLevel: 'M' });
    const qr = await pdf.embedPng(qrPng);

    page.drawText('CampusITSM', { x: 50, y: 790, size: 22, font: bold, color: rgb(0.12, 0.22, 0.38) });
    page.drawText(input.institutionName || 'Universidad Privada Tallán', { x: 50, y: 765, size: 11, font: regular, color: rgb(0.35, 0.35, 0.35) });
    page.drawText('CONSTANCIA DE ATENCIÓN', { x: 50, y: 710, size: 18, font: bold });
    page.drawText(`Código: ${input.code}`, { x: 50, y: 670, size: 11, font: regular });
    page.drawText(`Incidencia: ${input.ticketCode}`, { x: 50, y: 645, size: 11, font: regular });
    page.drawText(`Servicio: ${certificateServiceLabels[input.service]}`, { x: 50, y: 620, size: 11, font: regular });
    page.drawText(`Resolución: ${input.resolvedAt.toISOString()}`, { x: 50, y: 595, size: 11, font: regular });
    page.drawText(`Emisión: ${input.issuedAt.toISOString()}`, { x: 50, y: 570, size: 11, font: regular });
    page.drawText(`Titular: ${input.ownerName}`, { x: 50, y: 520, size: 11, font: regular });
    const start = input.ticketCreatedAt?.getTime() ?? input.issuedAt.getTime();
    const durationMinutes = Math.max(0, Math.round((input.resolvedAt.getTime() - start) / 60000));
    page.drawText(`Duración registrada: ${durationMinutes} minutos`, { x: 50, y: 545, size: 11, font: regular });
    page.drawText('La incidencia fue resuelta y la falla tecnológica fue confirmada.', { x: 50, y: 500, size: 11, font: regular });
    page.drawText('Firma institucional · prototipo', { x: 50, y: 455, size: 12, font: bold });
    page.drawText('QR de verificación pública', { x: 398, y: 330, size: 9, font: regular });
    page.drawImage(qr, { x: 390, y: 350, width: 150, height: 150 });
    page.drawText('Este documento no constituye una firma digital certificada.', { x: 50, y: 70, size: 8, font: regular, color: rgb(0.45, 0.45, 0.45) });
    const bytes = await pdf.save({ useObjectStreams: true });
    return Buffer.from(bytes);
  }
}
