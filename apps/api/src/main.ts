import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  const document = SwaggerModule.createDocument(app, new DocumentBuilder()
    .setTitle('CampusITSM — base compartida')
    .setDescription('Infraestructura, identidad Supabase y calendario manual. Sesión opaca HttpOnly; escrituras con Origin y X-CSRF-Token. Auth requiere configuración del proyecto.')
    .addCookieAuth('campus_session', undefined, 'campus_session')
    .setVersion('1.0.0').build());
  SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: '/api/openapi.json' });
  await app.listen(3000, '0.0.0.0');
}

bootstrap().catch(() => {
  console.error('No se pudo iniciar la API; revisar configuración y dependencias.');
  process.exit(1);
});
