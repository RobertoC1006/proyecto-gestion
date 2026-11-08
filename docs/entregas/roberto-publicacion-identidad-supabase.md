# Publicación de identidad y base Supabase en main

7 de noviembre de 2026. Roberto solicitó expresamente «publicalo al main».
Entrega conjunta de identidad, autorización común, base compartida y coordinación.
No inicia otra semana ni desarrolla los módulos de Johan/Jasmine.

## Contenido integrado

Main de partida: `02d10f557fdf81af81fdeef1ecf7fb7d210aaeed`, comprobado con fetch
antes de integrar. Main no tenía cambios adicionales respecto de esta base.
Historia de origen de `identidad-supabase` y `base-compartida-supabase`:

- `8b02d6f`: Supabase Auth, P01, sesión opaca, PKCE, roles/permisos y calendario autorizado.
- `1b84ba8` y `13c6cc7`: planes y autonomía de coordinación del equipo.
- `864413a`: conexión privada a Supabase, sesiones por instalación y migración manual separada del arranque.
- `2a3b6dc` y `478ea0f`: operación, organización exclusiva e invitaciones de colaboradores.
- Actualización de publicación: memoria, planes, guías y estado del equipo señalan main como base común.

La integración conserva los commits mediante avance directo de main, sin reescribir
historia. Se comprueba la igualdad con origin/main después de publicar. Solo se
retiran las dos ramas propias al comprobar que sus commits están en main; se
conserva front-vistas y cualquier rama ajena que aparezca al verificar GitHub.

## Verificación de esta publicación

- `scripts/verify-auth.ps1`: 22 pruebas aprobadas, 0 fallos. PostgreSQL descartable
  aislado, migraciones, permisos, sesiones, renovación concurrente, PKCE,
  separación de claves entre instalaciones y control de conexiones API/migrador.
  Proveedor sustituido solo dentro de los tests. Recursos de prueba retirados.
- `npm run build` en apps/web: compilación TypeScript/Vite aprobada.
- `npm run test:e2e` en apps/web: 9 pruebas aprobadas. Formularios de acceso,
  registro/recuperación, calendario, conflictos, permisos y adaptación móvil.
  Las escenas con fixture no acreditan registro externo de los compañeros.
- Comprobación de secretos del contenido publicado y de los paquetes: sin .env,
  respaldos, contraseñas PostgreSQL, clave de cifrado o correos personales de colaboradores.
- Aplicación de trabajo conservada en campusitsm:8080. Reconstrucción desde main
  sin lanzar migrate ni arrancar PostgreSQL local; salud API/DB/Python y esquema
  remoto comprobados. Los datos y volúmenes existentes se conservan.

No se reaplica el traslado ni se ejecuta otra migración remota al publicar Git.
Las seis migraciones ya están aplicadas en el esquema campusitsm del proyecto
npjibnlxepiwfermtcmo, organización gratuita exclusiva CampusITSM.

## Cómo empiezan los compañeros

Actualizar main, crear su rama de módulo y leer AGENTS, su plan y las guías
[de operación](../OPERACION_SUPABASE.md) y [colaboradores](../COLABORADORES_SUPABASE.md).
La configuración se entrega por un medio privado; cada computadora genera su
propia clave de sesiones. No copiar el .env completo de Roberto ni repetir semilla
o bootstrap del administrador en cada clon.

Johan: gestion-incidencias, semana 1. Jasmine: administracion-usuarios,
consentimiento y auditoría inicial, semana 1. Sus módulos reutilizan identidad,
calendario, componentes y el historial Prisma común. No crear otro login.

Pendientes: confirmar las aceptaciones (Roberto informó una, sin identificar la
cuenta), entregar configuración privada y autorizar la organización CampusITSM
en los conectores. El conector de este chat todavía solo alcanza RobertoC1006;
la aplicación sigue conectada por su configuración de servidor. SMTP para personas
ajenas al equipo y los módulos de consentimiento/auditoría conservan sus responsables.

Los ZIP se regeneran desde main y verifican sus archivos. Son documentación y
referencias; no contienen la configuración privada ni reemplazan el código.
