import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    const { validateConnection } = require(join(process.cwd(), 'prisma/connection.cjs'));
    validateConnection(process.env.DATABASE_URL, 'api');
    await this.$connect();
    // Solo lectura: arrancar/reconstruir Docker nunca modifica el esquema compartido.
    const applied = await this.$queryRaw<{ migration_name: string; checksum: string }[]>`
      SELECT migration_name, checksum FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    for (const folder of readdirSync(join(process.cwd(), 'prisma/migrations'), { withFileTypes: true }).filter(d => d.isDirectory())) {
      const checksum = createHash('sha256').update(readFileSync(join(process.cwd(), 'prisma/migrations', folder.name, 'migration.sql'))).digest('hex');
      if (!applied.some(m => m.migration_name === folder.name && m.checksum === checksum)) {
        throw new Error(`Esquema pendiente o migración modificada: ${folder.name}. Coordina y aplica el comando manual de migración antes de arrancar.`);
      }
    }
  }
  async onModuleDestroy() { await this.$disconnect(); }
}
