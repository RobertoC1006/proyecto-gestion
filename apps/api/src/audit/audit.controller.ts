import { ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, Get, Header, Query, Req, UseGuards } from '@nestjs/common';
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
}
