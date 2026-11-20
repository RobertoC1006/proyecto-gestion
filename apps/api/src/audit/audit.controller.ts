import { ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, Get, Header, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthRequest } from '../auth/auth.service';
import { CampusSessionGuard, RequirePermissions } from '../auth/auth.guard';
import { AuditPageDto } from './audit.dto';
import { AuditService } from './audit.service';

@ApiTags('Auditoría')
@ApiCookieAuth('campus_session')
@ApiUnauthorizedResponse({ description: 'Sesión no disponible o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere audit:read:institution.' })
@UseGuards(CampusSessionGuard)
@RequirePermissions('audit:read:institution')
@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: AuditPageDto })
  list(@Req() req: AuthRequest, @Query() query: Record<string, unknown>) { return this.service.list(req.campusPrincipal!, query); }

  @Get('export')
  @Header('Cache-Control', 'no-store')
  async export(@Req() req: AuthRequest, @Query() query: Record<string, unknown>, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="campusitsm-auditoria.csv"');
    return this.service.export(req.campusPrincipal!, query);
  }
}
