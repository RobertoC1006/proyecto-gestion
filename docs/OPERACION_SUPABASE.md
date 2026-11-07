# Operación de CampusITSM con la base compartida

Estado verificado el 7 de noviembre de 2026 en `base-compartida-supabase`.
Proyecto [CampusITSM](https://supabase.com/dashboard/project/npjibnlxepiwfermtcmo),
organización RobertoC1006, esquema de negocio **campusitsm**. Seleccionar ese
esquema en el Table Editor para ver tablas y datos. Auth mantiene sus usuarios
en Authentication; AppUser conserva perfiles/roles con el mismo UUID.

## Preparar otra computadora

1. Recibir el código autorizado por Roberto; esta entrega todavía no es main.
2. Ejecutar `./scripts/prepare-auth.ps1`. Genera una clave de cifrado propia.
3. Recibir DATABASE_URL de API por un medio privado y completar SUPABASE_URL y
   SUPABASE_PUBLISHABLE_KEY del mismo proyecto en `.env`. Mantener origen
   `http://localhost:8080` y código de institución UPT-DEMO.
4. Ejecutar `docker compose up --build -d --wait` y abrir localhost:8080.
   No ejecutar seed ni bootstrap-admin en cada computadora: ya hay institución,
   equipo y administrador comunes. No copiar el `.env` completo de Roberto.

DATABASE_URL usa `campusitsm_api.<project-ref>` y pooler de sesión
`aws-1-sa-east-1.pooler.supabase.com:5432/postgres`, con `schema=campusitsm`,
`sslmode=require&sslaccept=strict&sslcert=certs/supabase-ca.crt&connection_limit=3`.
El certificado público está incluido en Prisma; no es una clave privada.
El navegador solo consume NestJS; nunca recibe estas credenciales PostgreSQL.

Cada persona conserva su clave AUTH_ENCRYPTION_KEY. Su huella identifica el
ámbito de las sesiones y flujos PKCE. Una instalación no descifra ni elimina
sesiones de otra al cerrar sesión. Un cambio global de permisos/estado o
recuperación de contraseña sí invalida los accesos correspondientes de la cuenta.
Un evento común se ve al actualizar la pantalla; no se añadió tiempo real.

Invitaciones de Johan/Jasmine aplazadas por Roberto hasta disponer de sus correos.
Revisar el alcance de la organización antes de invitar: también contiene otro
proyecto. No conceder acceso a otros proyectos ni contratar un plan por defecto.
El rol del panel Supabase es distinto del rol dentro de CampusITSM y de la
credencial PostgreSQL de desarrollo. El SMTP de registro externo sigue pendiente.

## Trabajo diario y migraciones

El arranque normal levanta web, api y predictions. No inicia db ni migrate.
La API consulta el historial y exige las migraciones de su código con su checksum;
acepta migraciones adicionales de otros módulos. Nunca aplica cambios al arrancar.
Si faltan, coordinar el historial requerido y ejecutar el paso manual.

Las migraciones se preparan y validan en PostgreSQL descartable, no con
`migrate dev`, `db push`, `reset`, pruebas destructivas o cargas de ejemplo en Supabase.
Recibir también las migraciones exactas aplicadas por otros; no editarlas ni
crear otra migración para duplicar lo que ya existe.

```powershell
# Base local descartable y pruebas; las URL se sobrescriben sin heredar Supabase.
./scripts/verify-auth.ps1
./scripts/verify-calendar.ps1

# Solo tras validar, revisar el registro y comprobar el destino.
# Este archivo privado contiene MIGRATION_DATABASE_URL, nunca se comparte en ZIP.
docker compose --env-file .local/supabase/migrate.env --profile tools build migrate
docker compose --env-file .local/supabase/migrate.env --profile tools run --rm migrate

# Revisión de la aplicación en la instalación habitual.
docker compose up --build -d --wait
```

El rol migrador es distinto del rol de API: posee el esquema y puede crear objetos
allí; no es superusuario ni administrador de Auth. La herramienta comprueba host,
proyecto, rol, esquema, puerto y TLS. Protege después el historial para que la API
solo pueda leerlo. Cambiar de rama o reconstruir Docker no ejecuta este comando.
La credencial migradora se entrega solo a quienes implementan cambios delegados,
por un medio privado; no se guarda en el `.env` usado normalmente por la API.

Para una tabla nueva del módulo, guardar SQL compatible en una nueva migración
Prisma; incluir RLS y la política de acceso solo del servidor cuando exista el rol:

```sql
DO $block$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusitsm_api') THEN
    ALTER TABLE "TablaDelModulo" ENABLE ROW LEVEL SECURITY;
    CREATE POLICY campusitsm_server ON "TablaDelModulo"
      FOR ALL TO campusitsm_api USING (true) WITH CHECK (true);
  END IF;
END $block$;
```

No otorgar acceso a anon/authenticated ni exponer campusitsm en la Data API.
La política permite al servidor aplicar las reglas por institución/rol/objeto;
no reemplaza la autorización de NestJS. Las nuevas tablas del rol migrador reciben
CRUD para la API mediante privilegios predeterminados. Registrar/avisar según
[coordinación](COORDINACION_SUPABASE.md); los cambios ordinarios del módulo no
necesitan permiso por tabla, y los cambios comunes/incompatibles se consultan.

## Respaldo, prueba de restauración y retorno

Antes del traslado se guardaron dos respaldos privados bajo `.local/backups/`;
el final es `before-supabase-20261107T203101Z`. Incluye dump, huella SHA256,
configuración anterior, exportación privada y comparación del traslado.
No subirlo a Git ni entregar ese directorio a compañeros: contiene datos de cuenta
y material de sesiones. Ambos dumps se restauraron en PostgreSQL 17 descartable,
sin puertos ni volúmenes persistentes, eliminando solo ese contenedor al terminar.

La copia final conserva 1 institución, 1 equipo, 1 curso, 1 evento, 2 cambios
académicos, 1 perfil administrador y 1 cambio de identidad, además del estado
transitorio de acceso. Se compararon conteos y SHA256 del contenido de las 12
tablas dentro de la misma transacción del traslado. No se restauró encima de
auth/storage ni se sobrescribieron filas remotas existentes.

PostgreSQL local está detenido y su volumen sigue intacto. Es una copia histórica,
no una réplica ni una base que deba seguir usándose a la par. Volver a un commit
no revierte Supabase ni trae al volumen los cambios posteriores.

Si es necesario retornar: detener escrituras, respaldar primero la base remota
actual y conciliar cualquier cambio posterior; usar una restauración separada
verificada y las migraciones de la versión que se ejecutará. El modo local se
activa con `-f compose.yml -f compose.local.yml`, conserva el volumen y exige una
migración explícita antes de iniciar la API. Las sesiones antiguas deben asociarse
a la clave de esa instalación o descartarse de forma coordinada. No improvisar
un cambio de URL que pierda datos nuevos ni borrar volúmenes para resolverlo.

Referencias: [conexiones Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres),
[verificación TLS Prisma 6](https://docs.prisma.io/docs/orm/v6/overview/databases/postgresql).
CA pública: distribución oficial Supabase,
`https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`;
SHA256 `700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7`.

Cifrado obligatorio activado en Database Settings → Enforce SSL on incoming
connections; reinicio de Supabase completado. Comprobación desde la conexión real
de API: rol campusitsm_api, esquema campusitsm, pg_stat_ssl.ssl=true y seis
migraciones finalizadas. Salud y sesión real recuperadas después del reinicio.
La URL Prisma exige TLS y verifica el certificado con la CA oficial incluida.
