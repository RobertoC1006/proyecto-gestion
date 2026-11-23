import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post, Req, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthRequest } from '../auth/auth.service';
import { CampusSessionGuard, RequirePermissions } from '../auth/auth.guard';
import { CertificatesService } from './certificates.service';
import { CertificatesPageDto, CertificateDto, CertificateEligibilityDto } from './certificates.dto';

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
  verify(@Param('code') code: string, @Body() body: { pdfBase64?: unknown }) {
    if (!body || typeof body !== 'object') throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Proporciona el PDF para verificar.' });
    return this.certificates.verifyPdf(code, body.pdfBase64);
  }
}
