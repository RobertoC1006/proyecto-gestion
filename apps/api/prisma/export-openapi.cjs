require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
const { AppModule } = require('../dist/app.module');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  const doc = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('CampusITSM — base compartida')
    .setDescription('Identidad Supabase y calendario. Cookie HttpOnly; Origin y X-CSRF-Token para escrituras.')
    .setVersion('1.0.0').addCookieAuth('campus_session', undefined, 'campus_session').build());
  fs.writeFileSync(path.resolve(__dirname, '../../../docs/api/openapi.json'), JSON.stringify(doc, null, 2) + '\n');
  await app.close();
})().catch(() => { console.error('No se pudo generar OpenAPI.'); process.exitCode = 1; });
