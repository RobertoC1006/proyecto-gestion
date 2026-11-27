import { BadRequestException, HttpException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

export const MAX_EVIDENCE_BYTES = 5_242_880;
const MAX_BASE64_CHARS = 6_990_508;
export type EvidenceInput = { originalName: string; mimeType: string; bytes: Buffer; sha256: string };

function invalid(message: string): never {
  throw new BadRequestException({ code: 'VALIDATION_ERROR', message });
}
function wrongType(): never {
  throw new HttpException({ code: 'UNSUPPORTED_FILE_TYPE', message: 'El archivo debe ser un PNG, JPG o PDF válido.' }, 415);
}

export async function evidenceInput(raw: unknown): Promise<EvidenceInput> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) invalid('El archivo no es válido.');
  const value = raw as Record<string, unknown>;
  if (Object.keys(value).sort().join(',') !== 'contentBase64,mimeType,originalName') invalid('El archivo tiene campos no permitidos.');
  const { originalName, mimeType, contentBase64 } = value;
  if (typeof originalName !== 'string' || !originalName.trim() || originalName.length > 255 ||
    /[\\/\x00-\x1f\x7f]/.test(originalName) || originalName.trim() !== originalName) invalid('El nombre del archivo no es válido.');
  if (typeof mimeType !== 'string' || !['image/png', 'image/jpeg', 'application/pdf'].includes(mimeType)) wrongType();
  const extension = originalName.split('.').pop()?.toLowerCase();
  if (!(mimeType === 'image/png' && extension === 'png') &&
      !(mimeType === 'image/jpeg' && ['jpg', 'jpeg'].includes(extension ?? '')) &&
      !(mimeType === 'application/pdf' && extension === 'pdf')) wrongType();
  if (typeof contentBase64 !== 'string') invalid('La codificación Base64 no es válida.');
  if (contentBase64.length > MAX_BASE64_CHARS) throw new HttpException({ code: 'FILE_TOO_LARGE', message: 'El archivo supera 5 MiB.' }, 413);
  if (!contentBase64 || contentBase64.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(contentBase64)) invalid('La codificación Base64 no es válida.');
  const bytes = Buffer.from(contentBase64, 'base64');
  if (bytes.toString('base64') !== contentBase64) invalid('La codificación Base64 no es canónica.');
  if (!bytes.length) invalid('El archivo está vacío.');
  if (bytes.length > MAX_EVIDENCE_BYTES) throw new HttpException({ code: 'FILE_TOO_LARGE', message: 'El archivo supera 5 MiB.' }, 413);
  try {
    if (mimeType === 'application/pdf') {
      if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-')) || !/%%EOF\s*$/.test(bytes.toString('latin1').slice(-1024))) wrongType();
      const doc = await PDFDocument.load(bytes, { throwOnInvalidObject: true });
      if (!doc.getPageCount()) wrongType();
    } else {
      const expected = mimeType === 'image/png' ? 'png' : 'jpeg';
      if (expected === 'png' && !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) wrongType();
      if (expected === 'jpeg' && !(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9)) wrongType();
      const image = sharp(bytes, { limitInputPixels: 20_000_000, failOn: 'error' });
      const metadata = await image.metadata();
      if (metadata.format !== expected) wrongType();
      await image.stats(); // Fuerza la decodificación completa; rechaza contenido truncado.
    }
  } catch (error) {
    if (error instanceof HttpException) throw error;
    wrongType();
  }
  return { originalName, mimeType, bytes, sha256: createHash('sha256').update(bytes).digest('hex') };
}
