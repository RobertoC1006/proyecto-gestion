import { Body, Controller, Get, Header, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CampusSessionGuard, RequirePermissions } from './auth.guard';
import { AuthRequest } from './auth.service';
import { RolePermissionsService } from './role-permissions.service';
import { RoleAccessDto, RoleMatrixDto, UpdateRolePermissionsDto } from './role-permissions.dto';

@ApiTags('Roles y permisos')
@ApiCookieAuth('campus_session')
@ApiUnauthorizedResponse({ description: 'Necesitas una sesión válida.' })
@ApiForbiddenResponse({ description: 'Solo administradores con permissions:manage.' })
@UseGuards(CampusSessionGuard)
@RequirePermissions('permissions:manage')
@Controller('role-permissions')
export class RolePermissionsController {
  constructor(private readonly service: RolePermissionsService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: RoleMatrixDto })
  list(@Req() req: AuthRequest) { return this.service.list(req.campusPrincipal!); }
  @Patch(':role')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: RoleAccessDto })
  @ApiBadRequestResponse({ description: 'Permisos, alcance o motivo inválidos.' })
  @ApiConflictResponse({ description: 'Otra persona modificó el rol.' })
  update(@Req() req: AuthRequest, @Param('role') role: string, @Body() body: UpdateRolePermissionsDto) {
    return this.service.update(req.campusPrincipal!, role, body);
  }
}
