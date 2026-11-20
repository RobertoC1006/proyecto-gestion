# Johan — revisión del Corte 3 de Semana 1

Rama `gestion-incidencias`. Cortes anteriores: `4d287c0` (núcleo NestJS,
Prisma y migración local) y `0c00a94` (P02–P05 conectadas). Esta revisión no
aplica cambios a Supabase PostgreSQL ni integra la rama en `main`.

## Comprobado

- Johan confirmó que las rutas HTTP funcionan y que un ticket creado aparece
  en el PostgreSQL local de `compose.local.yml`.
- La migración `20261108000100_tickets_core` figura sin pendientes en el
  migrador local. API, web, db y predictions quedaron saludables.
- API: compila y pasan cinco pruebas del servicio, incluidas solicitudes
  simultáneas con la misma clave, conflicto por contenido distinto, colisión
  de código, asociación académica y filtros de titular. OpenAPI se genera.
- Web: compila y pasan dos pruebas de interfaz con respuestas API controladas:
  P03→P04→P05→P02, ausencia de prioridad/clasificación inventadas y reintento
  con la misma `Idempotency-Key` tras fallo de red. El ancho móvil no desborda.
- Se revisaron capturas locales de P04/P05 en escritorio y P02 en móvil. La
  fila de P05 se ajustó para mostrar el código público largo sin superponerlo
  al servicio. Tras reconstruir la imagen web, Johan confirmó la vista y el
  filtro de estado; las dos pruebas de interfaz pasaron de nuevo sobre esa
  versión. No se modificó la familia visual compartida ni `.legacy-view` para
  otras pantallas.

## Pendiente para cerrar Semana 1 completa

- **Roberto — cursos propios:** acordar una consulta autorizada para que
  estudiante/docente seleccione curso y, cuando corresponda, sección en P03.
  Las rutas académicas actuales son solo administrativas. NestJS ya valida
  institución y asociación al recibir `scope: curso`; el formulario permite
  por ahora únicamente reportes generales.
- **Roberto — evidencia:** acordar flujo de carga, límites definitivos,
  almacenamiento privado y descarga autorizada. La tabla de metadatos existe,
  pero no hay carga ni descarga ni datos de archivo en respuestas HTTP. El
  volumen local no comparte archivos entre computadoras.
- **Roberto — migración compartida:** revisar SQL, `GRANT`/`REVOKE`, política
  RLS, servicio provisional y formato del código antes de aplicar a Supabase.
- **Jasmine — auditoría:** acordar integración futura de `ticket.created` sin
  crear otro motor y sin bloquear el registro.
- Ejecutar pruebas HTTP con otra cuenta para confirmar 404 de un ticket ajeno
  y revisar P02–P05 con datos reales en móvil. La prueba automatizada usa
  respuestas controladas y no sustituye esa comprobación.

No se marca P03 con curso/evidencia como terminado ni se afirma que Semana 1
esté completa mientras esos contratos sigan abiertos.

## Entrega a Roberto: decisiones y revisión necesarias

| Tema | Confirmación que necesita Johan | Trabajo posterior de Johan |
| --- | --- | --- |
| Cursos y secciones de P03 | Definir una consulta de **cursos y secciones propios** para estudiante/docente, derivada de la sesión y limitada a la institución y asociaciones académicas vigentes. Propuesta de rutas, aún no acordada: `GET /api/v1/academic/me/courses` y `GET /api/v1/academic/me/sections?courseId=…`; confirmar identificadores y campos visibles. Las rutas administrativas actuales no sirven para el selector del titular. | Habilitar `scope: curso`, seleccionar `courseId` y `sectionId` opcional desde esa consulta, conservar `scope: general` con ambos nulos y verificar los errores de asociación en NestJS. No crear un catálogo académico paralelo ni pedir UUID al usuario. |
| Evidencia de P03 | Acordar si se mantiene un archivo opcional por ticket como expresa el esquema actual, límites definitivos, transporte de carga, protección CSRF del flujo, almacenamiento privado y descarga autorizada. Confirmar cómo se compartirán los archivos entre instalaciones antes de usar la base común; el volumen local por sí solo no los comparte. PNG/JPG/PDF y 5 MB siguen siendo propuesta, no límite aprobado. | Implementar carga, verificación de firma/tamaño/tipo, reintento idempotente propio del adjunto y descarga solo tras autorizar al titular. No exponer `storageKey` ni rutas locales, ni guardar bytes en PostgreSQL. No cambiar el guard CSRF por cuenta propia. |
| Migración de tickets | Revisar `apps/api/prisma/migrations/20261108000100_tickets_core/migration.sql`, incluidos `CHECK`, índices, unicidad, `GRANT`/`REVOKE` efectivos y RLS para `Ticket` y `TicketAttachment`. Validar si el enum provisional de servicios debe sustituirse por catálogo canónico y si se mantiene el formato público aleatorio `INC-<año>-<aleatorio>`. | Atender correcciones mediante el historial Prisma correspondiente y volver a validar localmente. No aplicar a Supabase PostgreSQL antes de esa revisión; no usar credenciales migradoras remotas en este corte. |

Roberto puede revisar el SQL antes de terminar todo el módulo. El núcleo de
tickets y P02–P05 ya se pueden inspeccionar en la rama `gestion-incidencias`;
la integración en `main` continúa bajo su coordinación.

## Entrega a Jasmine: contrato de auditoría y futuros consumidores

- `ticket.created` es el **nombre propuesto** para el evento de creación. La
  carga mínima propuesta es actor (UUID del titular), institución, UUID del
  ticket e instante UTC. No debe contener descripción, evidencia, rutas de
  archivo ni credenciales. Jasmine debe confirmar nombre, forma de entrega y
  contrato del receptor de su auditoría; Johan lo integrará sin crear una tabla
  o motor paralelo. La falta de integración no bloquea el POST de Semana 1.
- `GET /api/v1/tickets` y `GET /api/v1/tickets/{id}` solo muestran tickets del
  titular en Semana 1. Jasmine no debe usarlos como consulta administrativa de
  constancias o reportes. Antes de consumir tickets en P09–P12, coordinar con
  Johan una lectura interna/autorizada con los datos mínimos de elegibilidad;
  no duplicar la tabla Ticket ni ampliar el alcance del endpoint personal.
- Los metadatos de `TicketAttachment` todavía no significan que exista un
  archivo disponible. Jasmine no debe asumir adjuntos descargables hasta que
  Roberto y Johan acuerden el flujo y la autorización.

La coordinación de auditoría con Jasmine queda documentada para integración
futura; **no es un bloqueo para cerrar el registro persistente actual**. Los
bloqueos funcionales de P03 son la consulta académica y el contrato de
evidencia a cargo de Roberto.
