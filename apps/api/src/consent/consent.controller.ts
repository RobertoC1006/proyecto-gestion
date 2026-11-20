import { ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Body, Controller, Get, Header, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthRequest } from '../auth/auth.service';
import { CampusSessionGuard, RequirePermissions } from '../auth/auth.guard';
import { ConsentAcceptanceDto, ConsentAcceptancePageDto, ConsentAcceptDto, ConsentMeDto, ConsentVersionDto } from './consent.dto';
import { ConsentService } from './consent.service';

@ApiTags('Consentimiento')
@ApiCookieAuth('campus_session')
@ApiUnauthorizedResponse({ description: 'Sesión no disponible o inválida.' })
@ApiForbiddenResponse({ description: 'La cuenta no puede aceptar consentimiento.' })
@UseGuards(CampusSessionGuard)
@Controller('consent')
export class ConsentController {
  constructor(private readonly service: ConsentService) {}

  @Get('current')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: ConsentVersionDto, nullable: true })
  current() { return this.service.current(); }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: ConsentMeDto })
  me(@Req() req: AuthRequest) { return this.service.mine(req.campusPrincipal!); }

  @Post('accept')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: ConsentAcceptanceDto })
  accept(@Req() req: AuthRequest, @Body() body: ConsentAcceptDto) { return this.service.accept(req.campusPrincipal!, body); }

  @Get('acceptances')
  @RequirePermissions('audit:read:institution')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: ConsentAcceptancePageDto })
  acceptances(@Req() req: AuthRequest, @Query() query: Record<string, unknown>) {
    return this.service.acceptances(req.campusPrincipal!, query);
  }
}
