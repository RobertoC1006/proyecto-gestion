import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class AuthConfig {
  get origin() { return process.env.APP_ORIGIN || 'http://localhost:8080'; }
  get institutionCode() { return process.env.AUTH_INSTITUTION_CODE || 'UPT-DEMO'; }
  get cookieName() { return this.origin.startsWith('https:') ? '__Host-campus_session' : 'campus_session'; }
  get secure() { return this.origin.startsWith('https:'); }
  get key(): Buffer {
    const key = Buffer.from(process.env.AUTH_ENCRYPTION_KEY || '', 'base64');
    if (key.length !== 32) throw this.unavailable();
    return key;
  }
  get ready() {
    try {
      const url = new URL(process.env.SUPABASE_URL || '');
      const key = process.env.SUPABASE_PUBLISHABLE_KEY || '';
      if (url.protocol !== 'https:' || !key || key.startsWith('sb_secret_')) return false;
      // Una clave antigua anon es válida; service_role nunca es necesaria para login.
      if (key.startsWith('ey')) {
        const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
        if (claims.role !== 'anon') return false;
      } else if (!key.startsWith('sb_publishable_')) return false;
      new URL(this.origin);
      return this.key.length === 32;
    } catch { return false; }
  }
  requireReady() { if (!this.ready) throw this.unavailable(); }
  unavailable() {
    return new ServiceUnavailableException({ code: 'AUTH_NOT_CONFIGURED', message: 'El acceso todavía no está disponible. Contacta con administración.' });
  }
}
