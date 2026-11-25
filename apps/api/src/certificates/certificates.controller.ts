import { FileInterceptor } from '@nestjs/platform-express';
import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post, Query, Req, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthRequest } from '../auth/auth.service';
import { CampusSessionGuard, RequirePermissions } from '../auth/auth.guard';
import { CertificatesService } from './certificates.service';
import { CertificatesPageDto, CertificateDto, CertificateAuditPageDto } from './certificates.dto';

@ApiTags('Constancias')
@ApiCookieAuth('campus_session')
@UseGuards(CampusSessionGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get()
  @RequirePermissions('certificates:request:self')
  @ApiOkResponse({ type: CertificatesPageDto })
  mine(@Req() request: AuthRequest) {
    return this.certificates.mine(request.campusPrincipal!);
  }

  @Get('audit')
  @RequirePermissions('audit:read:institution')
  @ApiOkResponse({ type: CertificateAuditPageDto })
  audit(@Req() request: AuthRequest, @Query() query: unknown) {
    return this.certificates.audit(request.campusPrincipal!, query);
  }

  @Post(':ticketId/issue')
  @HttpCode(200)
  @RequirePermissions('certificates:request:self')
  @ApiOkResponse({ type: CertificateDto })
  @ApiServiceUnavailableResponse({ description: 'CERTIFICATE_FILE_UNAVAILABLE: el PDF original no está disponible; la emisión y su huella se conservan.' })
  issue(@Req() request: AuthRequest, @Param('ticketId') ticketId: string) {
    return this.certificates.issue(request.campusPrincipal!, ticketId);
  }

  @Get(':id')
  @RequirePermissions('certificates:request:self')
  @ApiOkResponse({ type: CertificateDto })
  @ApiServiceUnavailableResponse({ description: 'CERTIFICATE_FILE_UNAVAILABLE: el PDF original no está disponible; la emisión y su huella se conservan.' })
  detail(@Req() request: AuthRequest, @Param('id') id: string) {
    return this.certificates.detail(request.campusPrincipal!, id);
  }

  @Get(':id/download')
  @RequirePermissions('certificates:request:self')
  @ApiOkResponse({ content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } })
  @ApiServiceUnavailableResponse({ description: 'CERTIFICATE_FILE_UNAVAILABLE: el PDF original no está disponible; la emisión y su huella se conservan.' })
  async download(@Req() request: AuthRequest, @Param('id') id: string, @Res({ passthrough: true }) response: Response) {
    const file = await this.certificates.download(request.campusPrincipal!, id);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="${file.code}.pdf"`);
    response.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(file.bytes);
  }
}

@ApiTags('Verificación pública')
@Controller('certificates/public')
export class PublicCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get(':code')
  lookup(@Param('code') code: string) {
    return this.certificates.publicLookup(code);
  }

  @Post(':code/verify')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5_242_880, files: 1, fields: 0 } }))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({ schema: { oneOf: [
    { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] },
    { type: 'object', properties: { pdfBase64: { type: 'string' } }, required: ['pdfBase64'] },
  ] } })
  verify(@Param('code') code: string, @UploadedFile() file: { buffer: Buffer } | undefined, @Body() body: { pdfBase64?: unknown } | undefined) {
    return this.certificates.verifyPdf(code, file?.buffer ?? body?.pdfBase64);
  }
}
