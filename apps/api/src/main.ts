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
    .setDescription('Solo infraestructura. Los módulos de negocio aún no están implementados.')
    .setVersion('1.0.0').build());
  SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: '/api/openapi.json' });
  await app.listen(3000, '0.0.0.0');
}

bootstrap().catch(() => {
  console.error('No se pudo iniciar la API; revisar configuración y dependencias.');
  process.exit(1);
});
