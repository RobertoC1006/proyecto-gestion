# CampusITSM

## Calendario manual en revisión

Este apartado corresponde exclusivamente a `calendario-academico`, pendiente de
autorización de Roberto para integrar en main. Ver contrato en
`docs/CONTRATO_CALENDARIO.md` y entrega en
`docs/entregas/roberto-semana-01-calendario.md`.

P17 `/admin/calendario`; P18 `/admin/calendario/nuevo`. La interfaz sigue los
mockups finales. Las rutas académicas responden 401 y la escritura permanece
deshabilitada hasta integrar la sesión/permisos de Jasmine. No usar el login
provisional para probar privilegios. CSV y factores/SLA no están en esta entrega.

Para revisar esta rama separada de los volúmenes de la base anterior:

```powershell
$env:WEB_PORT = '18083'
docker compose -p campusitsm-calendar-review up --build
```

Abrir [calendario en revisión](http://localhost:18083/admin/calendario).
No usar `docker compose up` sin proyecto explícito si se desea conservar la base
anterior sin aplicar esta migración. El comando anterior usa otros volúmenes.
Las migraciones de esta rama no se aplicaron en la base habitual.

Prueba real PostgreSQL y persistencia aislada:

```powershell
./scripts/verify-calendar.ps1
```

Pruebas de interfaz (requieren revisión funcionando en 18083; las escenas con datos
usan respuestas de prueba, separadas de las pruebas reales de PostgreSQL):

```powershell
cd apps/web
npm ci
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD/../../.local/browsers"
npx playwright install chromium --only-shell
npm run test:e2e
```

Contrato OpenAPI versionado: `docs/api/openapi.json`. Tras actualizar el backend,
exportar de `/api/openapi.json` y ejecutar `npm run api:types` en `apps/web`.
Los tipos de calendario se generan desde ese contrato, no desde modelos Prisma.

## Base Docker

Base local de la mesa de ayuda universitaria. Requiere Docker Desktop iniciado
con contenedores Linux y Docker Compose v2. Cada integrante puede construirla sin
instalar Node, Python ni PostgreSQL en su computadora.

## Arranque

Desde la raíz del repositorio:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

En Linux/macOS usar `cp .env.example .env`. Copiar solo la primera vez; conservar
la configuración propia en siguientes arranques. También se aceptan los valores
locales ficticios predeterminados sin `.env`.

Abrir [aplicación](http://localhost:8080),
[salud API](http://localhost:8080/api/v1/health),
[OpenAPI](http://localhost:8080/api/docs) o
[contrato JSON](http://localhost:8080/api/openapi.json).
Las vistas recuperadas siguen usando ejemplos; no hay cuentas reales de acceso.

| Servicio | Función | Acceso |
| --- | --- | --- |
| web | React construido + Nginx, proxy `/api/` | localhost:8080 |
| api | Backend NestJS y Prisma | interno, api:3000 |
| db | PostgreSQL | interno, db:5432 |
| predictions | Esqueleto Python, solo `/health` | interno, predictions:8000 |
| migrate | Aplica migraciones y termina con código 0 | previo a abrir API |
| seed | Semilla explícita idempotente | perfil tools |

DB debe estar saludable, las migraciones deben terminar y Python/API responder
antes de abrir web. `migrate` terminado con código 0 es normal. Una migración
fallida impide abrir API. Diagnóstico: `docker compose ps -a` y
`docker compose logs api migrate predictions`.

## Semilla y persistencia

Con la base arrancada, ejecutar explícitamente:

```powershell
docker compose --profile tools run --rm seed
```

Crea una institución ficticia y su equipo. No crea cuentas, claves ni tickets.
Repetirla no duplica ni actualiza registros existentes. No corre automáticamente.

```powershell
docker compose down
docker compose up --build
```

Estos comandos conservan los volúmenes `postgres_data`, `files_data` y `models_data`.
`down -v` los borra; no usarlo para reiniciar. Cambiar `.env` después de inicializar
el volumen no modifica las credenciales ya guardadas por PostgreSQL. Cada clon
tiene DB y archivos locales propios; no se conecta a la computadora de Roberto.

## Desarrollo dentro de Docker

Detener el modo de entrega y levantar con recarga:

```powershell
docker compose down
docker compose -f compose.yml -f compose.dev.yml up --build
```

Mismo punto de entrada y base local, con Vite y recarga de NestJS. Los fuentes se
montan desde `apps/`; las dependencias permanecen en las imágenes. Reconstruir al
cambiar dependencias o esquema. Para volver a entrega, detener con ambos archivos
y ejecutar el comando habitual.

## Migraciones

Roberto coordina `apps/api/prisma/schema.prisma`. Para preparar una migración nueva
solo en una base descartable de desarrollo:

```powershell
docker compose run --rm --user root --volume "${PWD}/apps/api/prisma:/app/prisma" api npx prisma migrate dev --name cambio --create-only
```

El montaje permite leer el esquema editado y guardar la migración en el repositorio.
Revisar/versionar el SQL y reconstruir para aplicar con `migrate deploy`.
`migrate dev` puede solicitar
reset ante divergencias; no usar con datos que se deban conservar. Nunca editar
migraciones aplicadas ni generar cambios del esquema en paralelo sin coordinar.

## Comprobaciones

```powershell
docker compose ps -a
Invoke-RestMethod http://localhost:8080/api/v1/health
docker compose exec api npx prisma migrate status
```

`scripts/verify-base.ps1` comprueba semilla, restricciones, reinicio, persistencia
y fallos de dependencias sobre un proyecto Compose/volúmenes propios de prueba.
No modifica los volúmenes habituales. Resultados: `docs/entregas/roberto-semana-01-base.md`.

Solo se publica `127.0.0.1`; acceso desde otros dispositivos y QR por red local
no se habilitan en esta entrega. Las claves futuras de IA son solo del servidor.
Ver [contexto](PROYECTO.md), [contratos](docs/CONTRATOS.md),
[estado](docs/ESTADO_EQUIPO.md) y [plan](planes/PLAN_ROBERTO.md).

Referencias: [arranque en Docker Compose](https://docs.docker.com/compose/how-tos/startup-order/)
y [migraciones de Prisma 6](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/deploy-migrations-from-a-local-environment).
