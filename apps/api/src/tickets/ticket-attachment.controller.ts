import { Body, Controller, Get, Param, Put, Req, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthRequest } from '../auth/auth.service';
import { CampusSessionGuard, RequirePermissions } from '../auth/auth.guard';
import { TicketAttachmentService } from './ticket-attachment.service';

export class TicketAttachmentInputDto {
  @ApiProperty({ maxLength: 255 })
  originalName!: string;
  @ApiProperty({ enum: ['image/png', 'image/jpeg', 'application/pdf'] })
  mimeType!: string;
  @ApiProperty({ description: 'Base64 canónico, sin prefijo data:, máximo 6990508 caracteres.' })
  contentBase64!: string;
}
export class TicketAttachmentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty({ format: 'uuid' })
  ticketId!: string;
  @ApiProperty()
  originalName!: string;
  @ApiProperty()
  mimeType!: string;
  @ApiProperty()
  sizeBytes!: number;
  @ApiProperty()
  sha256!: string;
  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

@ApiTags('Evidencias de incidencias')
@ApiCookieAuth('campus_session')
@UseGuards(CampusSessionGuard)
@Controller('tickets/:ticketId/attachment')
export class TicketAttachmentController {
  constructor(private readonly attachments: TicketAttachmentService) {}

  @Put()
  @RequirePermissions('tickets:create')
  @ApiBody({ type: TicketAttachmentInputDto })
  @ApiCreatedResponse({ type: TicketAttachmentDto })
  @ApiOkResponse({ type: TicketAttachmentDto, description: 'Reintento idéntico.' })
  async attach(@Req() request: AuthRequest, @Param('ticketId') ticketId: string,
    @Body() body: TicketAttachmentInputDto, @Res({ passthrough: true }) reply: Response) {
    const result = await this.attachments.attach(request.campusPrincipal!, ticketId, body);
    reply.status(result.created ? 201 : 200);
    reply.setHeader('Cache-Control', 'no-store');
    return result.attachment;
  }
  @Get()
  @RequirePermissions('tickets:read:self')
  @ApiOkResponse({ type: TicketAttachmentDto })
  async metadata(@Req() request: AuthRequest, @Param('ticketId') ticketId: string, @Res({ passthrough: true }) reply: Response) {
    reply.setHeader('Cache-Control', 'no-store');
    return this.attachments.metadata(request.campusPrincipal!, ticketId);
  }
  @Get('content')
  @RequirePermissions('tickets:read:self')
  async download(@Req() request: AuthRequest, @Param('ticketId') ticketId: string, @Res({ passthrough: true }) reply: Response) {
    const { metadata, bytes } = await this.attachments.download(request.campusPrincipal!, ticketId);
    const fallback = metadata.mimeType === 'application/pdf' ? 'evidencia.pdf' : metadata.mimeType === 'image/png' ? 'evidencia.png' : 'evidencia.jpg';
    reply.setHeader('Content-Type', metadata.mimeType);
    reply.setHeader('Content-Disposition', `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(metadata.originalName)}`);
    reply.setHeader('X-Content-Type-Options', 'nosniff');
    reply.setHeader('Cache-Control', 'no-store');
    return new StreamableFile(bytes);
  }
}
