# CampusITSM

Mesa de ayuda universitaria: React/Vite, NestJS, PostgreSQL/Prisma y Python auxiliar.
La base de negocio y Auth están en [Supabase CampusITSM](https://supabase.com/dashboard/project/npjibnlxepiwfermtcmo).
Frontend, backend y Python se ejecutan en la única instalación Docker de cada
integrante, en [localhost:8080](http://localhost:8080).

La transición está verificada para Roberto en `base-compartida-supabase`, basada
en `identidad-supabase`. Ambas entregas siguen sin integrar en main. Organización gratuita exclusiva CampusITSM; invitaciones Developer de
Johan/Jasmine enviadas, pendientes de aceptación y configuración privada.
Ver [colaboradores y conexión del agente](docs/COLABORADORES_SUPABASE.md).
Leer AGENTS, MEMORIA_PROYECTO, plan personal y [estado](docs/ESTADO_EQUIPO.md).

## Preparación y arranque

Requiere Docker Desktop con contenedores Linux y Docker Compose v2 reciente
(con soporte de `!reset` para las configuraciones aisladas de pruebas).

```powershell
# Solo la primera vez. Conservar el .env propio en siguientes arranques.
./scripts/prepare-auth.ps1
# Completar en privado DATABASE_URL de API, SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY.
docker compose up --build -d --wait
```

[Guía operativa](docs/OPERACION_SUPABASE.md): conexión, credenciales separadas,
migraciones, sesiones, pruebas y respaldo. No copiar claves privadas entre equipos.
No ejecutar seed ni bootstrap-admin en cada clon: institución y administrador ya
existen en la base común. Abrir [login](http://localhost:8080/login),
[calendario](http://localhost:8080/admin/calendario),
[salud](http://localhost:8080/api/v1/health) u [OpenAPI](http://localhost:8080/api/docs).
Registro propio con confirmación; SMTP para destinatarios externos aún pendiente.

| Servicio | Operación normal |
| --- | --- |
| web | React/Nginx, único puerto publicado 127.0.0.1:8080 |
| api | NestJS/Prisma interno; conexión cifrada a Supabase |
| predictions | Python interno, actualmente solo salud, sin modelo |
| db | Opcional para pruebas; PostgreSQL local de trabajo detenido, volumen conservado |
| migrate | Herramienta manual con credencial migradora; nunca se ejecuta al arrancar |
| seed / bootstrap-admin | Herramientas explícitas de instalación, no de arranque diario |

Cambiar de rama o reconstruir conserva datos. No usar `down -v`. Los datos remotos
son comunes; archivos/PDF/modelos de volúmenes todavía son locales. Ver un dato
nuevo requiere actualizar la consulta/pantalla, sin reconstruir Docker. Una tabla
nueva no crea endpoints o pantallas: quien la consuma actualiza modelo/código.

## Migraciones y coordinación

Un único esquema Prisma e historial en apps/api/prisma. Cada persona desarrolla
frontend, backend y pruebas de su módulo. Cambios compatibles nuevos de ese módulo
pueden validarse/aplicarse sin permiso por tabla, registrando y avisando al equipo.
Consultar antes cambios comunes, de otro módulo o incompatibles. No borrar tablas
o datos existentes ni modificar migraciones aplicadas. Una rama Git no aísla la base.

Preparar/validar SQL en PostgreSQL descartable. Nunca `migrate dev`, `db push`,
`reset` ni pruebas destructivas contra Supabase. Paso remoto explícito:

```powershell
docker compose --env-file .local/supabase/migrate.env --profile tools build migrate
docker compose --env-file .local/supabase/migrate.env --profile tools run --rm migrate
docker compose up --build -d --wait
```

El archivo privado contiene MIGRATION_DATABASE_URL. La API normal usa otra
credencial y verifica su historial sin modificarlo. Para pruebas se incorpora
compose.local.yml, que sobrescribe las URL remotas y activa PostgreSQL local.

```powershell
./scripts/verify-auth.ps1
./scripts/verify-calendar.ps1
./scripts/verify-base.ps1
```

Las pruebas se aíslan de la instalación de trabajo y cierran sus contenedores.
Para recarga durante desarrollo: `docker compose -f compose.yml -f compose.dev.yml up --build`.
Usa la misma instalación y la misma base compartida; no aplica migraciones.

## Entregas y contratos

P01 conecta Auth real; P17/P18 consultan y administran calendario con permisos.
Tickets, constancias y otras vistas provisionales pertenecen a sus responsables.
CSV/factor/SLA, clasificación IA y pronóstico aún no están implementados.

[Coordinación](docs/COORDINACION_SUPABASE.md), [registro BD](docs/REGISTRO_CAMBIOS_BD.md),
[identidad](docs/CONTRATO_IDENTIDAD.md), [diseño compartido](docs/DISENO_COMPONENTES.md)
y [entrega de transición](docs/entregas/roberto-semana-01-base-compartida.md).
Contrato versionado: docs/api/openapi.json. Cambios públicos de API se exportan
con `npm run api:export` en apps/api; `npm run api:types` en apps/web genera tipos.
Esta transición no cambió DTO ni rutas públicas.

Planes en planes/. Regenerar ZIP sin secretos con `python scripts/prepare-plan-packages.py`.
La integración en main sigue requiriendo autorización de Roberto.
