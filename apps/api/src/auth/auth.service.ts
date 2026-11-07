import { BadRequestException, ForbiddenException, HttpException, Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuthConfig } from './auth.config';
import { csrfToken, decrypt, digest, encrypt, equalSecret, opaqueToken } from './auth.crypto';
import { AuthProvider, ProviderTokens } from './auth.provider';
import { IdentityDirectory, principalFor } from './auth.directory';
import { CampusPrincipal } from './auth.policy';

export interface AuthRequest {
  method: string; headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string }; campusPrincipal?: CampusPrincipal;
}
export interface AuthResponse { setHeader(name: string, value: string): unknown; }
const failed = () => new UnauthorizedException({ code: 'SESSION_REQUIRED', message: 'Necesitas una sesión válida. Vuelve a iniciar sesión.' });

@Injectable()
export class AuthService {
  constructor(private readonly db: PrismaService, private readonly config: AuthConfig,
    @Inject(AuthProvider) private readonly provider: AuthProvider, private readonly directory: IdentityDirectory) {}

  cookie(request: AuthRequest) {
    const header = String(request.headers.cookie || '');
    const matches = header.split(';').map(s => s.trim()).filter(s => s.startsWith(`${this.config.cookieName}=`));
    if (matches.length !== 1) return null;
    const value = matches[0].slice(this.config.cookieName.length + 1);
    return /^[\w-]{43}$/.test(value) ? value : null;
  }
  setCookie(response: AuthResponse, value: string, maxAge = 28800) {
    response.setHeader('Set-Cookie', `${this.config.cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${this.config.secure ? '; Secure' : ''}`);
  }
  checkOrigin(request: AuthRequest) {
    if (request.headers.origin !== this.config.origin || request.headers['sec-fetch-site'] === 'cross-site') {
      throw new ForbiddenException({ code: 'WRITE_PROTECTION_REQUIRED', message: 'La solicitud debe realizarse desde CampusITSM.' });
    }
    if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
      throw new BadRequestException({ code: 'JSON_REQUIRED', message: 'La solicitud debe enviarse en formato JSON.' });
    }
  }
  checkWrite(request: AuthRequest, cookie: string) {
    this.checkOrigin(request);
    const token = request.headers['x-csrf-token'];
    if (typeof token !== 'string' || !equalSecret(token, csrfToken(this.config.key, cookie))) {
      throw new ForbiddenException({ code: 'WRITE_PROTECTION_REQUIRED', message: 'Actualiza la página e intenta nuevamente.' });
    }
  }
  async limit(request: AuthRequest, action: string, email: string) {
    // IP enviada exclusivamente por Nginx; API sin puertos públicos. No almacenar correo/IP en claro.
    const ip = String(request.headers['x-real-ip'] || request.socket?.remoteAddress || 'local');
    for (const [bucket, maximum] of [[`ip:${ip}`, 60], [`${action}:${email}`, action === 'login' ? 12 : 5]] as const) {
      const id = digest(bucket);
      const rows = await this.db.$queryRaw<{ attempts: number }[]>`
        INSERT INTO "AuthThrottle" ("id", "attempts", "expiresAt") VALUES (${id}, 1, now() + interval '10 minutes')
        ON CONFLICT ("id") DO UPDATE SET
          "attempts" = CASE WHEN "AuthThrottle"."expiresAt" < now() THEN 1 ELSE "AuthThrottle"."attempts" + 1 END,
          "expiresAt" = CASE WHEN "AuthThrottle"."expiresAt" < now() THEN now() + interval '10 minutes' ELSE "AuthThrottle"."expiresAt" END
        RETURNING "attempts"`;
      if (rows[0].attempts > maximum) throw new HttpException({ code: 'AUTH_RATE_LIMITED', message: 'Espera unos minutos antes de volver a intentarlo.' }, 429);
    }
  }
  fields(body: unknown, needsPassword = false, registering = false) {
    const b = (body && typeof body === 'object' && !Array.isArray(body) ? body : {}) as Record<string, unknown>;
    const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
    const password = typeof b.password === 'string' ? b.password : '';
    const displayName = typeof b.displayName === 'string' ? b.displayName.trim() : '';
    const fields: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) fields.email = 'Ingresa un correo válido.';
    if (needsPassword && (password.length < (registering ? 10 : 1) || password.length > 128)) fields.password = registering ? 'Usa entre 10 y 128 caracteres.' : 'Ingresa tu contraseña.';
    if (registering && (displayName.length < 2 || displayName.length > 120)) fields.displayName = 'Usa entre 2 y 120 caracteres para tu nombre.';
    if (Object.keys(fields).length) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Revisa los campos indicados.', fields });
    return { email, password, displayName };
  }
  status() { return { available: this.config.ready, registrationEnabled: this.config.ready, emailLinksRequired: true }; }
  async login(request: AuthRequest, response: AuthResponse, body: unknown) {
    this.checkOrigin(request); this.config.requireReady();
    const { email, password } = this.fields(body, true);
    await this.limit(request, 'login', email);
    const tokens = await this.provider.login(email, password);
    const identity = await this.provider.validate(tokens.access);
    const user = await this.directory.provision(identity);
    if (!user.active) {
      await this.provider.revoke(tokens.access).catch(() => {});
      throw new ForbiddenException({ code: 'ACCOUNT_DISABLED', message: 'Esta cuenta no tiene acceso. Contacta con administración.' });
    }
    const cookie = opaqueToken(), id = digest(cookie), previous = this.cookie(request);
    await this.db.$transaction(async tx => {
      await tx.authSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      await tx.authThrottle.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      if (previous) await tx.authSession.deleteMany({ where: { id: digest(previous) } });
      await tx.authSession.create({ data: { id, userId: user.id, accessVersion: user.accessVersion,
        tokens: encrypt(this.config.key, id, tokens), tokenExpiresAt: new Date(tokens.expiresAt * 1000), expiresAt: new Date(Date.now() + 8 * 3600000) } });
    });
    this.setCookie(response, cookie);
    return this.sessionResult(principalFor(user, true), cookie);
  }
  private sessionResult(principal: CampusPrincipal, cookie: string) {
    const { accessVersion, csrfVerified, ...user } = principal;
    return { user, csrfToken: csrfToken(this.config.key, cookie) };
  }
  async resolve(request: AuthRequest): Promise<CampusPrincipal | null> {
    const cookie = this.cookie(request);
    if (!cookie) return null;
    this.config.requireReady();
    const writing = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if (writing) this.checkWrite(request, cookie);
    const id = digest(cookie);
    const result = await this.db.$transaction(async tx => {
      // Un solo refresh por sesión, incluso entre procesos. No confiar en locks de memoria.
      await tx.$queryRaw`SELECT "id" FROM "AuthSession" WHERE "id" = ${id} FOR UPDATE`;
      const session = await tx.authSession.findUnique({ where: { id }, include: { user: true } });
      if (!session) return { principal: null };
      const discard = async () => { await tx.authSession.delete({ where: { id } }); return { principal: null }; };
      if (session.expiresAt.getTime() <= Date.now() || !session.user.active || session.accessVersion !== session.user.accessVersion) return discard();
      try {
        let tokens = decrypt<ProviderTokens>(this.config.key, id, session.tokens);
        if (session.tokenExpiresAt.getTime() < Date.now() + 60000) {
          tokens = await this.provider.refresh(tokens.refresh);
          await tx.authSession.update({ where: { id }, data: { tokens: encrypt(this.config.key, id, tokens), tokenExpiresAt: new Date(tokens.expiresAt * 1000) } });
        }
        const identity = await this.provider.validate(tokens.access);
        if (identity.id !== session.userId) return discard();
        return { principal: principalFor(session.user, writing) };
      } catch (error) {
        if (error instanceof UnauthorizedException) return discard();
        // Confirmar tokens ya rotados aun si getUser falla temporalmente después del refresh.
        return { principal: null, error: error instanceof HttpException ? error : new ServiceUnavailableException({ code: 'AUTH_UNAVAILABLE', message: 'No se pudo comprobar la sesión. Inténtalo nuevamente.' }) };
      }
    }, { timeout: 25000, maxWait: 25000 });
    if (result.error) throw result.error;
    return result.principal;
  }
  async me(request: AuthRequest) {
    const principal = await this.resolve(request);
    if (!principal) throw failed();
    return this.sessionResult(principal, this.cookie(request)!);
  }
  async logout(request: AuthRequest, response: AuthResponse) {
    const cookie = this.cookie(request);
    if (!cookie) { this.checkOrigin(request); this.setCookie(response, '', 0); return { message: 'Sesión cerrada.', providerRevoked: true }; }
    this.checkWrite(request, cookie);
    const id = digest(cookie);
    const tokens = await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "AuthSession" WHERE "id" = ${id} FOR UPDATE`;
      const session = await tx.authSession.findUnique({ where: { id } });
      if (!session) return null;
      await tx.authSession.delete({ where: { id } });
      return decrypt<ProviderTokens>(this.config.key, id, session.tokens);
    });
    this.setCookie(response, '', 0);
    let providerRevoked = true;
    if (tokens) try { await this.provider.revoke(tokens.access); } catch { providerRevoked = false; }
    return { message: providerRevoked ? 'Sesión cerrada.' : 'Sesión local cerrada. No se pudo confirmar el cierre en el proveedor.', providerRevoked };
  }
  private get flowCookieName() { return this.config.secure ? '__Host-campus_flow' : 'campus_flow'; }
  private flowCookie(request: AuthRequest) {
    const values = String(request.headers.cookie || '').split(';').map(s => s.trim()).filter(s => s.startsWith(`${this.flowCookieName}=`));
    if (values.length !== 1) return null;
    const cookie = values[0].slice(this.flowCookieName.length + 1);
    return /^[\w-]{43}$/.test(cookie) ? cookie : null;
  }
  private setFlowCookie(response: AuthResponse, cookie: string, maxAge = 3600) {
    response.setHeader('Set-Cookie', `${this.flowCookieName}=${cookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${this.config.secure ? '; Secure' : ''}`);
  }
  private async saveFlow(request: AuthRequest, response: AuthResponse, purpose: string, secret: string) {
    const cookie = opaqueToken(), id = digest(cookie), previous = this.flowCookie(request);
    await this.db.$transaction(async tx => {
      await tx.authFlow.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      if (previous) await tx.authFlow.deleteMany({ where: { id: digest(previous) } });
      await tx.authFlow.create({ data: { id, purpose, secret: encrypt(this.config.key, id, secret), expiresAt: new Date(Date.now() + 3600000) } });
    });
    this.setFlowCookie(response, cookie);
  }
  async register(request: AuthRequest, response: AuthResponse, body: unknown) {
    this.checkOrigin(request); this.config.requireReady();
    const { email, password, displayName } = this.fields(body, true, true);
    await this.limit(request, 'register', email);
    const storage = await this.provider.register(email, password, displayName);
    await this.saveFlow(request, response, 'signup', storage);
    return { message: 'Si el registro es válido, recibirás un enlace para confirmar tu correo. Ábrelo en este mismo navegador y después inicia sesión.' };
  }
  async recover(request: AuthRequest, response: AuthResponse, body: unknown) {
    this.checkOrigin(request); this.config.requireReady();
    const { email } = this.fields(body); await this.limit(request, 'recover', email);
    const storage = await this.provider.recover(email);
    await this.saveFlow(request, response, 'recovery', storage);
    return { message: 'Si la cuenta existe, recibirás un enlace de recuperación. Ábrelo en este mismo navegador.' };
  }
  async callback(request: AuthRequest, response: AuthResponse, code: unknown) {
    const cookie = this.flowCookie(request);
    if (!cookie || typeof code !== 'string' || code.length > 1000) throw failed();
    const id = digest(cookie);
    const purpose = await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "AuthFlow" WHERE "id" = ${id} FOR UPDATE`;
      const flow = await tx.authFlow.findUnique({ where: { id } });
      if (!flow || flow.expiresAt.getTime() < Date.now() || !['signup', 'recovery'].includes(flow.purpose)) throw failed();
      const tokens = await this.provider.exchange(code, decrypt<string>(this.config.key, id, flow.secret));
      await this.provider.validate(tokens.access);
      if (flow.purpose === 'recovery') {
        await tx.authFlow.update({ where: { id }, data: { purpose: 'password', secret: encrypt(this.config.key, id, tokens), expiresAt: new Date(Date.now() + 600000) } });
      } else {
        await this.provider.revoke(tokens.access); await tx.authFlow.delete({ where: { id } });
      }
      return flow.purpose;
    }, { timeout: 25000 });
    if (purpose === 'signup') this.setFlowCookie(response, '', 0);
    return purpose === 'signup' ? '/login?confirmed=1' : '/login?recovery=1';
  }
  async recoveryStatus(request: AuthRequest) {
    const cookie = this.flowCookie(request);
    if (!cookie) throw failed();
    const flow = await this.db.authFlow.findUnique({ where: { id: digest(cookie) } });
    if (!flow || flow.purpose !== 'password' || flow.expiresAt.getTime() < Date.now()) throw failed();
    return { csrfToken: csrfToken(this.config.key, cookie) };
  }
  async reset(request: AuthRequest, response: AuthResponse, body: unknown) {
    this.checkOrigin(request); this.config.requireReady();
    const cookie = this.flowCookie(request);
    if (!cookie) throw failed(); this.checkWrite(request, cookie);
    const password = (body as { password?: unknown })?.password;
    if (typeof password !== 'string' || password.length < 10 || password.length > 128) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Usa entre 10 y 128 caracteres para la nueva contraseña.' });
    const id = digest(cookie);
    await this.limit(request, 'reset', id);
    const error = await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "AuthFlow" WHERE "id" = ${id} FOR UPDATE`;
      const flow = await tx.authFlow.findUnique({ where: { id } });
      if (!flow || flow.purpose !== 'password' || flow.expiresAt.getTime() < Date.now()) throw failed();
      const tokens = decrypt<ProviderTokens>(this.config.key, id, flow.secret);
      const identity = await this.provider.validate(tokens.access);
      let failure: unknown;
      try { await this.provider.changePassword(tokens, password); } catch (e) { failure = e; }
      await tx.appUser.updateMany({ where: { id: identity.id }, data: { accessVersion: { increment: 1 } } });
      await tx.authSession.deleteMany({ where: { userId: identity.id } });
      await tx.authFlow.delete({ where: { id } });
      return failure;
    }, { timeout: 25000 });
    this.setFlowCookie(response, '', 0);
    if (error) throw error;
    return { message: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.' };
  }
}
