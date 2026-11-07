import { Body, Controller, Get, Header, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiResponse, ApiServiceUnavailableResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService, AuthRequest, AuthResponse } from './auth.service';
import { AuthMessageDto, AuthStatusDto, EmailDto, LoginDto, RegisterDto, PasswordDto, RecoveryStatusDto, SessionDto } from './auth.dto';

@ApiTags('Identidad — Supabase Auth')
@ApiBadRequestResponse({ description: 'Campos inválidos; code/message/fields.' })
@ApiForbiddenResponse({ description: 'Origen/CSRF inválido o cuenta desactivada.' })
@ApiUnauthorizedResponse({ description: 'Credenciales, código o sesión inválidos.' })
@ApiServiceUnavailableResponse({ description: 'Supabase sin configurar o temporalmente no disponible.' })
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Get('status') @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: AuthStatusDto })
  status() { return this.auth.status(); }
  @Post('login') @HttpCode(200) @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: SessionDto })
  login(@Req() r: AuthRequest, @Res({ passthrough: true }) s: AuthResponse, @Body() b: LoginDto) { return this.auth.login(r, s, b); }
  @Get('me') @ApiCookieAuth('campus_session') @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: SessionDto })
  me(@Req() r: AuthRequest) { return this.auth.me(r); }
  @Post('logout') @HttpCode(200) @ApiCookieAuth('campus_session') @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: AuthMessageDto })
  logout(@Req() r: AuthRequest, @Res({ passthrough: true }) s: AuthResponse) { return this.auth.logout(r, s); }
  @Post('register') @HttpCode(200) @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: AuthMessageDto })
  register(@Req() r: AuthRequest, @Res({ passthrough: true }) s: AuthResponse, @Body() b: RegisterDto) { return this.auth.register(r, s, b); }
  @Post('recovery/request') @HttpCode(200) @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: AuthMessageDto })
  recover(@Req() r: AuthRequest, @Res({ passthrough: true }) s: AuthResponse, @Body() b: EmailDto) { return this.auth.recover(r, s, b); }
  @Get('callback') @Header('Cache-Control', 'no-store')
  @Header('Referrer-Policy', 'no-referrer')
  @ApiResponse({ status: 303, description: 'Redirige a login, confirmación completada, recuperación limitada o enlace inválido.' })
  async callback(@Req() r: AuthRequest, @Res() s: AuthResponse & { redirect(status: number, path: string): unknown }, @Query('code') code: string) {
    try { s.redirect(303, await this.auth.callback(r, s, code)); }
    catch { s.redirect(303, '/login?link=invalid'); }
  }
  @Get('recovery/status') @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: RecoveryStatusDto })
  recoveryStatus(@Req() r: AuthRequest) { return this.auth.recoveryStatus(r); }
  @Post('recovery/reset') @HttpCode(200) @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: AuthMessageDto })
  reset(@Req() r: AuthRequest, @Res({ passthrough: true }) s: AuthResponse, @Body() b: PasswordDto) { return this.auth.reset(r, s, b); }
}
