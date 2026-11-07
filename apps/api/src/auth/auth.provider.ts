import { HttpException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createClient, Session, User } from '@supabase/supabase-js';
import { AuthConfig } from './auth.config';

export type ProviderTokens = { access: string; refresh: string; expiresAt: number };
export type ProviderIdentity = { id: string; email: string; displayName: string };
export abstract class AuthProvider {
  abstract login(email: string, password: string): Promise<ProviderTokens>;
  abstract register(email: string, password: string, displayName: string): Promise<string>;
  abstract validate(access: string): Promise<ProviderIdentity>;
  abstract refresh(refresh: string): Promise<ProviderTokens>;
  abstract revoke(access: string, scope?: 'local' | 'global'): Promise<void>;
  abstract recover(email: string): Promise<string>;
  abstract exchange(code: string, storage: string): Promise<ProviderTokens>;
  abstract changePassword(tokens: ProviderTokens, password: string): Promise<void>;
}

@Injectable()
export class SupabaseAuthProvider extends AuthProvider {
  constructor(private readonly config: AuthConfig) { super(); }
  private client(storage?: Record<string, string>) {
    this.config.requireReady();
    // Cliente nuevo por operación: ninguna sesión o renovación compartida entre usuarios.
    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: !!storage, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'pkce',
        ...(storage ? { storageKey: 'campus-flow', storage: {
          getItem: (key: string) => storage[key] || null,
          setItem: (key: string, value: string) => { storage[key] = value; },
          removeItem: (key: string) => { delete storage[key]; },
        } } : {}) },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) },
    });
  }
  private fail(error: { status?: number; code?: string } | null): never {
    if (error?.code === 'email_not_confirmed') throw new UnauthorizedException({ code: 'EMAIL_CONFIRMATION_REQUIRED', message: 'Tu correo todavía no está confirmado. Revisa tu bandeja de entrada y spam, abre el enlace de confirmación y vuelve a iniciar sesión.' });
    if (error?.code === 'email_address_not_authorized') throw new ServiceUnavailableException({ code: 'EMAIL_NOT_READY', message: 'El envío de confirmación no está habilitado para este correo. Contacta con administración.' });
    if (error?.status === 429) throw new HttpException({ code: 'AUTH_RATE_LIMITED', message: 'Espera unos minutos antes de volver a intentarlo.' }, 429);
    if (!error?.status || error.status >= 500) throw new ServiceUnavailableException({ code: 'AUTH_UNAVAILABLE', message: 'No pudimos conectar con el servicio de acceso. Inténtalo nuevamente.' });
    throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'No se pudo validar el acceso. Revisa tus datos y la confirmación de tu correo.' });
  }
  private tokens(session: Session | null): ProviderTokens {
    if (!session?.access_token || !session.refresh_token || !session.expires_at) this.fail({ status: 401 });
    return { access: session.access_token, refresh: session.refresh_token, expiresAt: session.expires_at };
  }
  async login(email: string, password: string) {
    const { data, error } = await this.client().auth.signInWithPassword({ email, password });
    if (error) this.fail(error); return this.tokens(data.session);
  }
  async register(email: string, password: string, displayName: string) {
    const storage: Record<string, string> = {};
    const { data, error } = await this.client(storage).auth.signUp({ email, password, options: {
      emailRedirectTo: `${this.config.origin}/api/v1/auth/callback`, data: { display_name: displayName },
    } });
    if (error) this.fail(error);
    // Registro no inicia sesión en CampusITSM ni utiliza una identidad ofuscada del proveedor.
    if (data.session) await this.revoke(data.session.access_token);
    return JSON.stringify(storage);
  }
  async validate(access: string) {
    const { data, error } = await this.client().auth.getUser(access);
    if (error) this.fail(error);
    const user: User | null = data.user;
    if (!user?.email || !user.email_confirmed_at || !/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(user.id)) this.fail({ status: 401 });
    return { id: user.id, email: user.email.toLowerCase(), displayName: String(user.user_metadata?.display_name || user.email.split('@')[0]).trim().slice(0, 120) || 'Usuario' };
  }
  async refresh(refresh_token: string) {
    const { data, error } = await this.client().auth.refreshSession({ refresh_token });
    if (error) this.fail(error); return this.tokens(data.session);
  }
  async revoke(access: string, scope: 'local' | 'global' = 'local') {
    const { error } = await this.client().auth.admin.signOut(access, scope);
    if (error) this.fail(error);
  }
  async recover(email: string) {
    const storage: Record<string, string> = {};
    const { error } = await this.client(storage).auth.resetPasswordForEmail(email, { redirectTo: `${this.config.origin}/api/v1/auth/callback` });
    if (error) this.fail(error);
    return JSON.stringify(storage);
  }
  async exchange(code: string, storage: string) {
    const { data, error } = await this.client(JSON.parse(storage)).auth.exchangeCodeForSession(code);
    if (error) this.fail(error);
    return this.tokens(data.session);
  }
  async changePassword(tokens: ProviderTokens, password: string) {
    const client = this.client();
    const { error: sessionError } = await client.auth.setSession({ access_token: tokens.access, refresh_token: tokens.refresh });
    if (sessionError) this.fail(sessionError);
    const { error } = await client.auth.updateUser({ password });
    if (error) this.fail(error);
    const { error: signoutError } = await client.auth.signOut({ scope: 'global' });
    if (signoutError) this.fail(signoutError);
  }
}
