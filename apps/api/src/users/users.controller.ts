import { Body, Controller, Get, Inject, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthRequest } from '../auth/auth.service';
import { CampusSessionGuard, RequirePermissions } from '../auth/auth.guard';
import { UsersService } from './users.service';
import { SupportTeamItemDto, UpdateUserAccessDto, UserItemDto, UsersPageDto, UsersQueryDto } from './users.dto';

@ApiTags('Usuarios — administración')
@ApiCookieAuth('campus_session')
@ApiUnauthorizedResponse({ description: 'Sesión no disponible o inválida.' })
@ApiForbiddenResponse({ description: 'Requiere rol administrador activo con permiso users:manage.' })
@ApiBadRequestResponse({ description: 'VALIDATION_ERROR: revisa los campos, identificadores y paginación.' })
@UseGuards(CampusSessionGuard)
@RequirePermissions('users:manage')
@Controller('users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({ type: UsersPageDto, description: 'Lista paginada de usuarios de la institución.' })
  listUsers(@Req() req: AuthRequest, @Query() query: UsersQueryDto) {
    return this.usersService.listUsers(req.campusPrincipal!, query);
  }

  @Get('teams')
  @ApiOkResponse({ type: [SupportTeamItemDto], description: 'Catálogo de equipos de soporte de la institución.' })
  listTeams(@Req() req: AuthRequest) {
    return this.usersService.listSupportTeams(req.campusPrincipal!);
  }

  @Get(':id')
  @ApiOkResponse({ type: UserItemDto, description: 'Detalle de un usuario de la institución.' })
  @ApiNotFoundResponse({ description: 'No se encontró el usuario en la institución.' })
  getUser(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.usersService.getUser(req.campusPrincipal!, id);
  }

  @Patch(':id/access')
  @ApiOkResponse({ type: UserItemDto, description: 'Acceso actualizado con registro de auditoría.' })
  @ApiBadRequestResponse({ description: 'Datos de validación inválidos o equipo ajeno a la institución.' })
  @ApiConflictResponse({ description: 'Conflicto por versión de acceso concurrente (CONFLICT) o protección del último administrador (LAST_ADMINISTRATOR).' })
  updateAccess(@Req() req: AuthRequest, @Param('id') id: string, @Body() body: UpdateUserAccessDto) {
    return this.usersService.updateAccess(req.campusPrincipal!, id, body);
  }
}
