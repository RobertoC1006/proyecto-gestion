# Incidencias — contrato propuesto para Semana 1

Responsable: Johan. Rama: `gestion-incidencias`. Johan puede generar la
migración de tickets y validarla en PostgreSQL local mediante
`compose.local.yml`. Roberto revisará el SQL resultante antes de cualquier
aplicación a la base compartida; no hace falta terminar ni fusionar todo el
módulo para esa revisión. La identidad utiliza Supabase Auth real a través de
NestJS.

El SQL de Corte 1 está en
`apps/api/prisma/migrations/20261108000100_tickets_core/migration.sql`.
El migrador local informa siete migraciones sin pendientes y la API inicia
saludablemente con `compose.local.yml`. Faltan las pruebas HTTP con sesión real;
no se ha aplicado a la base compartida.

## Alcance y fuente de servicios

El alcance del reporte (`general` o `curso`) es independiente del servicio de TI
afectado. `general` exige `courseId` y `sectionId` nulos. `curso` exige `courseId`
y permite `sectionId` nulo. NestJS comprueba que el curso pertenece a la
institución del titular. Si se indica `sectionId`, comprueba que pertenece a ese
curso y que el titular está asociado a esa sección. Si `sectionId` es nulo,
comprueba una asociación válida del titular dentro del curso. Las claves
foráneas protegen la integridad, pero no acreditan esa asociación del titular.
El servicio `aula_virtual` no implica por sí mismo `scope: curso`.

`TicketService` en Prisma es la única fuente de identificadores de este módulo:
`aula_virtual`, `wifi_red`, `correo`, `equipos`, `impresoras`,
`cuentas_accesos`, `videoconferencia`, `sistemas_institucionales`,
`almacenamiento_nube`, `software_licencias` y `otro`. No existe
`servicio_general`. Es una lista local provisional aprobada para avanzar; el
backend publica identificadores y etiquetas desde este único módulo para P03,
y React no mantiene otra lista. Roberto puede sustituir esta fuente por su
catálogo canónico antes de aplicar la migración compartida.

## Sesión, permisos y errores

Todas las rutas de tickets requieren la sesión opaca existente. Estudiante y
docente tienen `tickets:create` y `tickets:read:self`; listado y detalle de
Semana 1 solo leen casos del titular y su institución. No hay alcance de equipo
para TI.
Las escrituras conservan la verificación existente de `Origin`, JSON y
`X-CSRF-Token`; OpenAPI usa `security: [{campus_session: []}]`.

Errores `{code,message,fields?}`: 400 `VALIDATION_ERROR`, 401
`SESSION_REQUIRED`, 403 `FORBIDDEN` o `WRITE_PROTECTION_REQUIRED`, 404
`NOT_FOUND` para caso ajeno o inexistente, 409 `IDEMPOTENCY_CONFLICT` y 503
`DEPENDENCY_UNAVAILABLE`. No se expone si existe un ticket ajeno.

## POST /api/v1/tickets

`Content-Type: application/json`; cabecera obligatoria `Idempotency-Key` con
UUID. Cuerpo:

```json
{
  "description": "No puedo acceder al aula virtual.",
  "service": "aula_virtual",
  "scope": "curso",
  "courseId": "uuid-del-curso",
  "sectionId": null
}
```

`description` debe tener contenido significativo (propuesta: 20–5000 caracteres
tras recortar espacios). `service` debe ser uno de los identificadores del
módulo. `courseId` y `sectionId` son UUID o nulos conforme a `scope`. El servidor
obtiene `ownerId` e `institutionId` de la sesión; rechaza identidad, prioridad,
clasificación o estado enviados por el cliente. La relación académica se valida
en NestJS mediante las tablas/servicios existentes, sin deducirla del texto.

Respuesta inicial 201 `Created`, con `Location: /api/v1/tickets/{id}`. Ejemplo:

```json
{
  "id": "uuid-interno",
  "code": "INC-2026-CODIGO_ALEATORIO",
  "description": "No puedo acceder al aula virtual.",
  "service": "aula_virtual",
  "scope": "curso",
  "courseId": "uuid-del-curso",
  "sectionId": null,
  "status": "registrado",
  "classificationStatus": "pendiente",
  "priority": null,
  "createdAt": "2026-11-08T18:00:00.000Z",
  "updatedAt": "2026-11-08T18:00:00.000Z"
}
```

El código visible es provisionalmente `INC-<año UTC>-<aleatorio>`: 96 bits
obtenidos con un generador criptográfico, codificados sin ambigüedad. `id` UUID
es la identidad interna. La unicidad de `code` está en PostgreSQL; la API
regenera el código y reintenta si hay colisión. Roberto revisará el formato.
No se calcula ni afirma prioridad, clasificación, contexto o SLA en esta semana.

La unicidad de `(institutionId,ownerId,idempotencyKey)` se confirma en la base.
La API calcula una huella SHA-256 del cuerpo semántico validado y canonizado:
descripción, servicio, alcance, curso y sección. No depende del orden de claves
JSON. Dos peticiones simultáneas con la misma clave producen una sola fila:
la restricción única decide cuál se confirma. Si la otra inserción falla por
esa restricción, la API deja terminar y revertir por completo la transacción
fallida. Después consulta en una transacción nueva, con una vista actualizada,
por `(institutionId,ownerId,idempotencyKey)` y compara `requestHash`; nunca
consulta al ganador dentro de la transacción abortada. Mismo contenido: 200
`OK`, mismo cuerpo y `Location`. Contenido distinto: 409
`IDEMPOTENCY_CONFLICT`, sin alterar la fila. Si excepcionalmente la fila aún no
es visible, reintenta la lectura de forma acotada antes de devolver un error
transitorio; no crea otro ticket. El formulario conserva la clave al
reintentar tras timeout, interrupción o respuesta perdida. Esta clave protege
solo la creación del ticket: la carga futura del adjunto necesitará su propia
protección de reintentos, definida antes de implementar esa carga.

Una colisión de la restricción única de `code` es distinta del conflicto de
`idempotencyKey`: se genera otro código seguro y se reintenta la creación en
una transacción nueva, conservando la misma clave y huella del intento. Los
demás errores de base no se interpretan como reintentos idempotentes.

### OpenAPI propuesto

La representación se generará desde DTO y controladores NestJS, no mediante
edición manual de `docs/api/openapi.json`:

```yaml
paths:
  /api/v1/tickets:
    post:
      security: [{campus_session: []}]
      parameters:
        - in: header
          name: Idempotency-Key
          required: true
          schema: {type: string, format: uuid}
      requestBody:
        required: true
        content:
          application/json:
            schema: {$ref: '#/components/schemas/CreateTicketDto'}
      responses:
        '201': {description: Reporte creado; Location identifica el recurso}
        '200': {description: Reintento idéntico; mismo ticket y Location}
        '409': {description: IDEMPOTENCY_CONFLICT}
    get:
      security: [{campus_session: []}]
      responses:
        '200': {description: Página de tickets propios}
  /api/v1/tickets/{id}:
    get:
      security: [{campus_session: []}]
      responses:
        '200': {description: Detalle del ticket propio}
        '404': {description: Ticket inexistente o no visible}
  /api/v1/tickets/services:
    get:
      security: [{campus_session: []}]
      responses:
        '200': {description: Identificadores y etiquetas provisionales del módulo}
```

`CreateTicketDto` exige `description`, `service`, `scope`, `courseId` y
`sectionId` (estos dos últimos aceptan `null` según el alcance). Las rutas
principales documentarán también 400, 401, 403 y 503 según la sección de errores; el
OpenAPI generado incluirá parámetros y DTO completos.

## GET /api/v1/tickets y GET /api/v1/tickets/{id}

El listado acepta `page` (predeterminado 1), `pageSize` (predeterminado 20,
máximo 100), `status` y `search` sobre código/descripción propios. Devuelve
`{items,total,page,pageSize}`, ordenado por `createdAt DESC,id DESC` y filtrado
por titular e institución antes de contar o paginar. La vista resumida incluye
`id`, `code`, `description`, `service`, `scope`, `status`,
`classificationStatus`, `priority: null`, `createdAt` y `updatedAt`.

El detalle acepta UUID y devuelve el reporte propio con curso/sección y,
cuando exista el flujo acordado, metadatos de evidencia visibles al titular.
Nunca incluye `storageKey` ni rutas locales. ID ajeno o inexistente: el mismo 404.
Ninguna ruta acepta un parámetro de titular arbitrario.

## Servicios para P03 y evidencia opcional

`GET /api/v1/tickets/services` devuelve la lista de identificadores y etiquetas
del módulo, sin una tabla nueva. El cliente consume esta respuesta para el
selector de P03. El curso se selecciona de los datos académicos autorizados; no
se crea un catálogo de cursos paralelo.

La captura opcional de P03 sigue pendiente de cerrar con Roberto: flujo de
carga, límites definitivos, almacenamiento privado y descarga autorizada. El
plan menciona PNG/JPG/PDF hasta 5 MB como punto de partida, sujeto a esa
coordinación. `TicketAttachment` reserva solo metadatos opcionales; todavía no
se implementa carga, Base64 ni descarga. El guard CSRF existente no cambia.
Los bytes se desarrollarán fuera de la carpeta pública y de PostgreSQL, en un
volumen privado local; **no se comparten entre computadoras**. Una respuesta
HTTP nunca incluye `storageKey` ni una ruta del sistema de archivos.

Prisma expresa modelos, relaciones e índices únicos, pero **no crea por sí solo**
los `CHECK` siguientes ni las políticas RLS. Se añadieron al SQL versionado
de Corte 1 y deben revisarse y validarse primero en PostgreSQL local;
los fragmentos de este contrato no se han ejecutado. La migración de metadatos
requiere al menos estas restricciones SQL,
además de la unicidad de `ticketId` y `storageKey` ya expresada en Prisma:

```sql
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_size_positive"
  CHECK ("sizeBytes" > 0);
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_sha256_hex"
  CHECK ("sha256" ~ '^[0-9a-f]{64}$');
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_mime_allowed"
  CHECK ("mimeType" IN ('image/png', 'image/jpeg', 'application/pdf'));
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_storage_key_opaque"
  CHECK ("storageKey" ~ '^[A-Za-z0-9_-]+$');
```

La migración también necesita un `CHECK` para `Ticket`: `scope = general`
requiere `courseId` y `sectionId` nulos; `scope = curso` requiere `courseId`,
con `sectionId` nullable. La FK compuesta garantiza que una sección indicada
pertenezca al curso, mientras NestJS comprueba la asociación del titular.

SQL incluido en la migración local propuesta, pendiente de revisión y validación en
PostgreSQL local:

```sql
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_scope_academic_fields"
  CHECK (
    ("scope" = 'general' AND "courseId" IS NULL AND "sectionId" IS NULL)
    OR ("scope" = 'curso' AND "courseId" IS NOT NULL)
  );
```

La clave de almacenamiento será opaca, generada por el servidor, única y sin
componentes de ruta. El tipo declarado también deberá contrastarse con la firma
real del archivo antes de guardar bytes. La futura migración incluirá RLS tanto
para `Ticket` como para `TicketAttachment` cuando exista el rol
`campusitsm_api`, con política de acceso solo para el servidor. RLS no sustituye
la comprobación del titular en NestJS. RLS por sí sola tampoco limita los
privilegios de acceso a las tablas: la futura migración debe revisar los
privilegios efectivos y definir los `GRANT`/`REVOKE` necesarios para que solo
los roles previstos puedan acceder a `Ticket` y `TicketAttachment`. Los
privilegios concretos se determinarán tras revisar los roles y permisos
existentes; este contrato no los presupone. Además de esa revisión, se debe
habilitar RLS y crear la política para `campusitsm_api`. El bloque previsto
para esta última parte es:

```sql
DO $block$
DECLARE item text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusitsm_api') THEN
    FOREACH item IN ARRAY ARRAY['Ticket', 'TicketAttachment'] LOOP
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', item);
      EXECUTE format(
        'CREATE POLICY campusitsm_server ON %I FOR ALL TO campusitsm_api USING (true) WITH CHECK (true)',
        item
      );
    END LOOP;
  END IF;
END $block$;
```

## Auditoría y revisión

`ticket.created` es un evento de integración futura para Jasmine, con actor,
institución, ID del ticket e instante, sin descripción ni archivo. No se añade
tabla ni motor paralelo de auditoría y su ausencia no bloquea la creación.
Roberto revisará el contrato, formato de código, catálogo inicial y almacenamiento
antes de cualquier aplicación en la base compartida. La migración inicial de
tickets deberá incluir restricciones de alcance, integridad, índices, revisión
de `GRANT`/`REVOKE` y RLS condicional para `campusitsm_api`; se validará primero
solo en PostgreSQL local.
