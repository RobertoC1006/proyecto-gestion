# Johan — Semana 1 de incidencias — Corte 4

Fecha: 12 de noviembre de 2026

Rama: `gestion-incidencias`

Alcance: conexión de P03 a cursos propios y documentación del estado P02–P05.

## Cambios

- Se integró `origin/main`, que contiene la entrega autorizada de cursos propios
  de Roberto, el módulo de Usuarios y los cambios de acceso/permisos publicados
  por el equipo. La integración conserva Tickets y conecta ambos módulos en la
  API, navegación, página inicial, OpenAPI y tipos web.
- P03 consulta `/api/v1/academic/me/courses` solo cuando se elige el alcance
  Curso. Usa `allPages` y los tipos del cliente académico existente. General no
  consulta cursos y envía `courseId: null` y `sectionId: null`.
- En Curso el titular selecciona una asociación propia; la sección es opcional.
  Cambiar de curso limpia la sección seleccionada antes de consultar las nuevas
  opciones. Lista vacía y error se distinguen; los errores ofrecen reintento y
  el formulario conserva sus valores.
- Se añadieron escenarios Playwright para General, Curso y cambio de sección.
- Se actualizó el contrato de tickets y el estado del equipo. No se implementó
  la carga/descarga de evidencias ni la integración futura `ticket.created`.

## Verificaciones ejecutadas

- `apps/api`: `npm run prisma:generate`, `npm run build`, `npm run api:export`.
- `apps/api`: `node --test test/tickets.test.cjs` — 5 pruebas aprobadas.
- `apps/web`: `npm run api:types`, `npx tsc --noEmit` y
  `node --check test/tickets.spec.cjs`.
- Revisión `git diff --check` sin errores.

La suite académica de integración no completó porque no tenía conexión
PostgreSQL local configurada. La compilación Vite no completó en esta sesión por
un bloqueo de acceso del sandbox fuera del directorio web.

## Pendientes y límites

- Ejecutar `20261111000100_role_permissions` en PostgreSQL local con
  `compose.local.yml`; la última captura de Docker de Johan mostraba el API
  reiniciándose, PostgreSQL/Python saludables y el contenedor de migración con
  una última ejecución cinco días antes. No inferir por esa captura que la API
  ya se recuperó.
- Ejecutar Playwright con la aplicación local, probar cursos/secciones con
  asociaciones reales, 404 HTTP con dos cuentas locales y persistencia tras
  reiniciar; revisar P02–P05 en escritorio y móvil.
- La migración `20261108000100_tickets_core` conserva el SQL revisado por Roberto.
  Su revisión descartable de 35 comprobaciones está documentada en
  `REVISION_MIGRACION_TICKETS.md`; no se pudo repetir aquí por falta de Docker.
  No aplicar tickets ni la migración de permisos a Supabase desde este corte.
- Los adjuntos esperan almacenamiento privado compartido y configuración de
  servidor habilitados por Roberto. `ticket.created` sigue a cargo de Jasmine y
  no bloquea tickets.

## Comandos de referencia

Desde la raíz del repositorio:

```powershell
docker compose -f compose.yml -f compose.local.yml --profile tools run --rm migrate
docker compose -f compose.yml -f compose.local.yml up --build -d --wait
docker compose -f compose.yml -f compose.local.yml ps
```

Estos comandos deben usar ambos archivos Compose para que las migraciones y la
aplicación apunten al PostgreSQL local. No eliminar volúmenes ni usar la
credencial migradora remota.
