# Coordinación de cambios en la base compartida

Registro del equipo, no sustituto del historial de migraciones Prisma ni de la
auditoría de aplicación. Aplicar el procedimiento de
[COORDINACION_SUPABASE.md](COORDINACION_SUPABASE.md).

Transición ejecutada por solicitud de Roberto el 7 de noviembre de 2026.
Destino: CampusITSM / npjibnlxepiwfermtcmo / esquema campusitsm.
Código de la entrega: `base-compartida-supabase@864413a`; aún sin main.
Respaldo final privado restaurado; traslado atómico con conteos/SHA256 de las
12 tablas. Sin sobrescribir auth/storage ni datos remotos preexistentes.

| Fecha | Responsable / módulo | Rama y commit | Archivo de migración | Tablas / índice / contratos afectados | Entorno de destino | Alcance delegado o acuerdo común / ejecutor | Estado y verificación |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-11-07 | Roberto / infraestructura común | base-compartida-supabase / 864413a | 20261106000100_installation/migration.sql | Institution/SupportTeam | Supabase CampusITSM / campusitsm | Transición solicitada por Roberto / agente de Roberto | Aplicado y verificado con Prisma; seis migraciones finalizadas, pruebas aisladas y contenido trasladado comprobado |
| 2026-11-07 | Roberto / infraestructura común | base-compartida-supabase / 864413a | 20261106000200_academic_calendar/migration.sql | Cursos/secciones/asociaciones/eventos y AcademicChange | Supabase CampusITSM / campusitsm | Transición solicitada por Roberto / agente de Roberto | Aplicado y verificado con Prisma; seis migraciones finalizadas, pruebas aisladas y contenido trasladado comprobado |
| 2026-11-07 | Roberto / infraestructura común | base-compartida-supabase / 864413a | 20261107000100_identity/migration.sql | AppUser/roles/sesiones/throttle y IdentityChange | Supabase CampusITSM / campusitsm | Transición solicitada por Roberto / agente de Roberto | Aplicado y verificado con Prisma; seis migraciones finalizadas, pruebas aisladas y contenido trasladado comprobado |
| 2026-11-07 | Roberto / infraestructura común | base-compartida-supabase / 864413a | 20261107000200_auth_email_flow/migration.sql | AuthFlow | Supabase CampusITSM / campusitsm | Transición solicitada por Roberto / agente de Roberto | Aplicado y verificado con Prisma; seis migraciones finalizadas, pruebas aisladas y contenido trasladado comprobado |
| 2026-11-07 | Roberto / infraestructura común | base-compartida-supabase / 864413a | 20261107000300_shared_instances/migration.sql | instanceId e índices de AuthSession/AuthFlow; conserva sesiones antiguas | Supabase CampusITSM / campusitsm | Transición solicitada por Roberto / agente de Roberto | Aplicado y verificado con Prisma; seis migraciones finalizadas, pruebas aisladas y contenido trasladado comprobado |
| 2026-11-07 | Roberto / infraestructura común | base-compartida-supabase / 864413a | 20261107000400_server_only_access/migration.sql | RLS para las 12 tablas de negocio; política solo para API servidor | Supabase CampusITSM / campusitsm | Transición solicitada por Roberto / agente de Roberto | Aplicado y verificado con Prisma; seis migraciones finalizadas, pruebas aisladas y contenido trasladado comprobado |

Estados: anunciado, validado localmente, acordado cuando afecte partes comunes, aplicado, verificado o requiere
corrección. Cada entrada debe explicar brevemente la compatibilidad con los otros
módulos, pruebas, respaldo cuando corresponda y dependencia que deben recibir los
compañeros. No anotar secretos, URLs con credenciales ni datos personales.

Para tablas/columnas/índices nuevos del módulo asignado, compatibles y dentro del
plan, basta el alcance delegado por Roberto: no pedirle permiso por cada tabla.
Registrar y avisar no equivale a esperar una aprobación. Consultar previamente
los cambios sobre otros módulos, identidad/permisos comunes o incompatibles.

No completar una fila como aplicado/verificado por el hecho de aprobar un plan
o crear un archivo SQL. Si una migración ya se aplicó, conservar su archivo exacto;
un cambio posterior requiere otra migración y otra entrada.

## Preparación de infraestructura y datos

- Migración de infraestructura MCP `20261107202641_campusitsm_private_schema_roles`:
  esquema privado y roles campusitsm_api/campusitsm_migrator, sin superusuario,
  CREATEDB, CREATEROLE o BYPASSRLS. Contraseñas generadas y conservadas solo en
  configuración privada ignorada. El historial de negocio sigue siendo Prisma.
- Se negó uso del esquema a anon/authenticated/PUBLIC. La API tiene CRUD,
  sin CREATE en campusitsm/public ni acceso a auth.users. El migrador posee solo
  el esquema de negocio; privilegios por defecto para nuevas tablas del servidor.
- El comando de despliegue revoca INSERT/UPDATE/DELETE de la API sobre
  _prisma_migrations; conserva SELECT para verificar compatibilidad al arrancar.
- Transferencia única con destino vacío comprobado, transacción y comparación
  de las 12 tablas: UUID/rol/fechas/auditoría conservados; sesiones/PKCE existentes
  vinculados a la instalación poseedora de su clave. No crear perfiles duplicados.
- La aplicación de Roberto pasó a Supabase; se detuvo PostgreSQL local conservando
  su volumen. En ese punto inicial las invitaciones se aplazaron hasta recibir
  correos; ver la actualización posterior de organización y colaboradores debajo.

Cifrado obligatorio activado en Database Settings → Enforce SSL on incoming
connections; reinicio de Supabase completado. Comprobación desde la conexión real
de API: rol campusitsm_api, esquema campusitsm, pg_stat_ssl.ssl=true y seis
migraciones finalizadas. Salud y sesión real recuperadas después del reinicio.
La URL Prisma exige TLS y verifica el certificado con la CA oficial incluida.

## Actualización de organización y colaboradores — 2026-11-07

Por autorización expresa de Roberto se creó la organización gratuita exclusiva
CampusITSM (exhurkcxcrjlskvldchp) y se trasladó el proyecto existente
npjibnlxepiwfermtcmo desde RobertoC1006. VEXOR permanece en la organización original.
Invitaciones Developer enviadas a Johan/Jasmine y verificadas como INVITED;
Roberto conserva Owner. No es una migración de tablas, no cambia Prisma ni suma
entradas a _prisma_migrations. Salud y conteos de usuario/curso/evento y TLS verificados.
Aceptar invitaciones y autorizar la nueva organización en los conectores sigue
pendiente. Ver [COLABORADORES_SUPABASE.md](COLABORADORES_SUPABASE.md).
