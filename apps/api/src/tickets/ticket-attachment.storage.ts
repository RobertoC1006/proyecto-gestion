import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'campusitsm-evidencias';

@Injectable()
export class TicketAttachmentStorage {
  private client?: SupabaseClient;
  private from() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_STORAGE_SECRET_KEY;
    if (!url || !key) throw new ServiceUnavailableException({ code: 'DEPENDENCY_UNAVAILABLE', message: 'El almacenamiento de evidencias no está configurado.' });
    this.client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    return this.client.storage.from(BUCKET);
  }
  async put(key: string, bytes: Buffer, mimeType: string) {
    try {
      const { error } = await this.from().upload(key, bytes, { contentType: mimeType, upsert: false, cacheControl: '0' });
      if (error) throw error;
    } catch { throw new ServiceUnavailableException({ code: 'DEPENDENCY_UNAVAILABLE', message: 'No se pudo guardar la evidencia.' }); }
  }
  async get(key: string): Promise<Buffer> {
    try {
      const { data, error } = await this.from().download(key, {}, { cache: 'no-store' });
      if (error || !data) throw error ?? Error('missing');
      return Buffer.from(await data.arrayBuffer());
    } catch { throw new ServiceUnavailableException({ code: 'DEPENDENCY_UNAVAILABLE', message: 'La evidencia no está disponible.' }); }
  }
  async remove(key: string) {
    try {
      const { error } = await this.from().remove([key]);
      if (error) throw error;
    } catch { throw new ServiceUnavailableException({ code: 'DEPENDENCY_UNAVAILABLE', message: 'No se pudo limpiar la carga incompleta.' }); }
  }
}
