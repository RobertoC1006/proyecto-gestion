# Coordinación de cambios en la base compartida

## Verificación del cierre de integración — 27 de noviembre de 2026

La integración de Johan `5833298` y la corrección del adaptador Groq a v5 no
cambian Prisma ni SQL. No se ejecutó el comando remoto de migración. Lectura
actual desde la API: proyecto CampusITSM, rol campusitsm_api, esquema campusitsm,
TLS activo y 18 entradas finalizadas/checksums exactos contra el repositorio.
La validación de 153 pruebas API se ejecutó únicamente en PostgreSQL temporal,
con las 18 migraciones, sin leer .env ni escribir pruebas sobre la base común.
Docker normal reconstruyó la instalación sin reset, db push, seed ni borrado
de volúmenes. No confundir esta verificación con una nueva aplicación de SQL.

## Demanda, tareas y notificaciones — 25 de noviembre de 2026

Autorización: «termina mi parte» y autorización previa de correcciones, migraciones
compatibles e integración/publicación tras validación. Ejecutor: agente de Roberto.
Destino comprobado con conexión real: proyecto CampusITSM npjibnlxepiwfermtcmo,
esquema campusitsm, campusitsm_migrator y TLS activo. Fuente SQL `fa21b15`;
código final validado `d8d0a37`. Quince checksums aplicados coincidentes antes.

| Migración | SHA256 | Finalización UTC |
| --- | --- | --- |
| 20261125000300_demand_forecasts | 7fbcb594d5343dc8a074f4bfcef98b55b0470f6a6ca7b3c02b31c6420326ea90 | 2026-11-25 20:25:14.567 |
| 20261125000400_demand_jobs | 325e3e9c6e7441b68422e21cee60e4fa2eea52e60791258050c7388e6b2f88f4 | 2026-11-25 20:25:15.562 |
| 20261125000500_alerts_notifications | 0a3e755265b59a39b4f7e7516454878914f0701486924445ba3aac96b5a6894d | 2026-11-25 20:25:16.376 |

Aplicadas solo estas pendientes mediante build y run --rm de migrate con
`.local/supabase/migrate.env`. Resultado: 18 migraciones finalizadas sin rollback,
18 checksums exactos, historial sin escrituras de API. RLS de las tablas nuevas,
sin lectura anon/authenticated y sin conceder DDL al rol de API. pg-boss arranca
con migrate:false/createSchema:false; colas creadas por SQL versionado en el
esquema campusitsm ya existente. No editar este SQL tras su aplicación.

Validación previa: 18 migraciones bajo migrador limitado en PostgreSQL aislado,
actualización desde doce SQL históricos conservando una constancia y huella,
149 pruebas API finales, 62 navegador, 5 Python y mantenimiento real de colas.
No se ejecutaron reset, db push ni semillas masivas contra Supabase. El histórico
sintético vive solo en models_data; Ticket conserva sus nueve filas al verificar.
Sesiones, credenciales, datos y volúmenes existentes conservados.

Respaldo privado previo y copia final en `.local/backups/shared-2026-11-25T20-39-30-423Z`:
dump del esquema, files y models, manifiesto SHA-256 y restauración aislada
comprobada. Sin restauración contra la base compartida. No compartir esos archivos
ni subirlos a Git. Contratos actualizados en este repositorio; entrega/aviso al
equipo mediante la documentación, sin mensajes externos enviados por el agente.

## Ampliación IA y auditoría de constancias — 25 de noviembre de 2026

Autorización: Roberto encargó integrar todo corregido y confirmó Groq. Ejecutor:
agente de Roberto. Destino CampusITSM / npjibnlxepiwfermtcmo / campusitsm,
rol de API campusitsm_api y TLS activo comprobados en consulta READ ONLY.
Fuente: integración que conserva Johan `786154d` y Jasmine `c218cf4`, más las
correcciones documentadas en la [entrega](entregas/roberto-integracion-equipo-20261125.md).

Antes: doce entradas finalizadas y doce checksums exactos. Se conservó sin editar
`20261120000100_certificates`; la versión modificada de Jasmine no sustituyó el
SQL aplicado. Se retiene el enum histórico inexistente, sin borrar valores/datos.
Validación: PostgreSQL 17 aislado, prueba de actualización desde los doce SQL con
una constancia existente idéntica antes/después, y 138 tests API aprobados.

Aplicación manual con `docker compose --env-file .local/supabase/migrate.env --profile tools run --rm migrate`
tras construir migrate. Solo se aplicaron las tres pendientes:

| Migración | SHA256 | Finalización UTC |
| --- | --- | --- |
| 20261120000100_ticket_ai_classification | `5e0b790f5eb980aaa86c02ce03a660b2b48b46c6d07deaa23f681ba770319769` | 2026-11-25 18:51:13.857Z |
| 20261125000100_certificate_audit_events | `5c850d0297da6027b9590ec4ac406e40a6c31593a447133805f16d01a6c831fd` | 2026-11-25 18:51:14.938Z |
| 20261125000200_automatic_classification_audit | `066f30d514882d21ef8c931688b9164c2b114f29a93f5d26b9d574d2b08ad55f` | 2026-11-25 18:51:16.004Z |

Archivos: `apps/api/prisma/migrations/<nombre>/migration.sql`. Hora Lima:
13:51:13–13:51:16. Añaden reportedService/metadatos IA; estados de clasificación;
eventos de emisión/descarga/consulta, actor y restricciones de constancias;
TicketChange admite actor automático nulo; recuperación de eventos históricos
de emisión. Se revoca UPDATE/DELETE de Certificate para API explícitamente.

Después: quince entradas sin rollback y quince checksums exactos. Cuatro tablas
de consentimiento/constancias conservan RLS, políticas del servidor y ausencia
de privilegios anon/authenticated. API solo SELECT/INSERT sobre Certificate y
eventos; historial Prisma solo lectura. Web/API/Python saludables con Supabase.
Sin borrado, reset, db push, seeds remotos o cambios en credenciales/sesiones.
Metadatos sin secretos en `.local/team-20261125-db-after.json`.

Recorrido autenticado y publicación de main pendientes. Este registro conserva
el aviso para los compañeros; no se enviaron mensajes externos. Deben incorporar
main y sus archivos exactos antes de reconstruir; sus ramas anteriores de
constancias no deben desplegar la migración reescrita.

## Integración autorizada de consentimiento y constancias — 24 de noviembre de 2026

Roberto autorizó expresamente las migraciones compatibles necesarias para la
integración. Ejecutor: agente de Roberto. Destino verificado:
CampusITSM / `npjibnlxepiwfermtcmo` / esquema `campusitsm`, pooler de sesión
`aws-1-sa-east-1.pooler.supabase.com:5432`, TLS activo y API `campusitsm_api`.
Fuente de ambos SQL: bundle `fb3cd26827ae7a335729f3ca7fd32bc7f76afb98`, rama
`integracion-avances-equipo`. Sin modificaciones de SQL aplicado.

**Antes:** consulta real de `_prisma_migrations` con transacción READ ONLY;
diez migraciones terminadas sin rollback, huellas coincidentes. Las siguientes
dos no tenían entrada y sus cuatro tablas no existían. No se supuso su
aplicación a partir de documentos históricos ni del conector (sin permiso).
Las doce migraciones se aplicaron y probaron en PostgreSQL 17 descartable,
red interna y almacenamiento tmpfs, sin usar configuración de Supabase.

**Aplicación:** comando documentado
`docker compose --env-file .local/supabase/migrate.env --profile tools run --rm migrate`,
tras construir `migrate`. El validador comprueba proyecto, rol migrador, esquema,
puerto y TLS; Prisma deploy aplicó exclusivamente:

| Archivo | SHA256 exacto | Finalización del historial (UTC) |
| --- | --- | --- |
| `apps/api/prisma/migrations/20261112000100_consent/migration.sql` | `c7bc6e7059ece2f0502cae802acc0f4d097c80f85c55960577ed7818000a1b50` | 2026-11-24 19:50:57.886Z |
| `apps/api/prisma/migrations/20261120000100_certificates/migration.sql` | `fdc3f6328a0393eb826b83927da0d92b60399a9424e7d0be00830bf8e2025dd9` | 2026-11-24 19:50:58.970Z |

Hora de Lima: 14:50:57–14:50:58. Migraciones aditivas de ConsentVersion,
ConsentAcceptance, Certificate y CertificateVerification, con índices, claves
foráneas y políticas de acceso del servidor. Sin seed, reset, db push,
migrate dev ni borrado de registros/volúmenes compartidos.

**Después:** doce entradas finalizadas, sin rollback, y doce checksums idénticos
a los archivos del candidato. Las cuatro tablas tienen RLS y política
`campusitsm_server` para `campusitsm_api`. Sin privilegios de lectura/escritura
para anon/authenticated. API puede leer/insertar aceptaciones y verificaciones,
sin UPDATE/DELETE; historial Prisma solo SELECT para API. Salud de la aplicación
con la base remota ok. Verificación conservada localmente sin secretos en
`.local/integration-db-after.json`. No se cambió la configuración de Auth.

La comprobación del candidato final `00eb7a2` completó 120 pruebas API aisladas;
54 recorridos de navegador y compilaciones aprobados. Recorrido con cuentas
reales pendiente, por lo que main aún no se publicó. El aviso de coordinación
queda en este registro para su futura publicación con la integración; no se
enviaron mensajes externos. Las tablas y sus archivos exactos deben acompañar
el código antes de reconstruir los backend de Johan/Jasmine.

## Flujo contextual autorizado — 12 de noviembre de 2026

Roberto encargó el flujo completo con tres perfiles visibles y autorizó
específicamente aplicar sus dos migraciones. Código `48b78d8`, rama
`flujo-caso-practico`; ejecutor agente de Roberto. Destino CampusITSM /
npjibnlxepiwfermtcmo / campusitsm. Antes: ocho migraciones, cero tickets y un
evento. No se guardó un volcado completo de registros privados.

Aplicadas mediante el comando manual migrador:

- `20261113000100_case_workflow/migration.sql`, SHA256
  `f106959114bdbf009b0cbd914bcc137ce6385630748d26358c6f40b403baf2bf`:
  autoría opcional de evento; campos de evaluación, atención, versión y origen
  sintético de Ticket; estados en_atencion/resuelto y clasificación manual;
  TicketChange y WorkflowPolicy. No borra ni sobrescribe datos existentes.
- `20261113000200_workflow_permissions/migration.sql`, SHA256
  `48407f82abe8f2185a13ec69fb3326aee7771b90aa32723792694112c6147975`:
  amplía los CHECK de RoleAccess para academic:teach y operación institucional.
  Conserva alcances anteriores y no cambia las filas RoleAccess existentes.

Verificación posterior: diez migraciones y diez checksums coincidentes,
TicketChange/WorkflowPolicy del migrador con RLS, sin lectura anon/authenticated.
API puede leer e insertar historial, sin UPDATE sobre TicketChange. API/web y
Python saludables en la única instalación campusitsm, localhost:8080.
58 comprobaciones aisladas aprobadas antes de aplicar. La prueba no escribe
en Supabase ni deja otra aplicación encendida.

Los compañeros deben recibir el esquema y los estados nuevos antes de atender
estos tickets con su aplicación; los clientes antiguos de incidencias no se
consideran compatibles con en_atencion/resuelto. Main y ramas ajenas permanecen
intactos. Este registro es el aviso en repositorio; no se enviaron mensajes.
Contrato: [CONTRATO_FLUJO_CASO_PRACTICO.md](CONTRATO_FLUJO_CASO_PRACTICO.md).

Carga posterior autorizada por el encargo de datos de demostración: acción
`POST /operations/demo` desde la sesión real administradora, con la cuenta
estudiante canónica seleccionada en pantalla y sin profesor (prueba aplazada).
Dos cursos DEMO, dos secciones y asociaciones, dos eventos y cuatro tickets
isDemo. Antes de crear: cero tickets; después: cuatro con puntajes 12/9/6/2.
El administrador atendió y resolvió T1 mediante la interfaz; solución y notas
indican expresamente simulación. No se cambiaron roles, claves ni cuentas del
equipo. Datos e historial quedan persistidos para revisión, sin limpiar tablas.

## Incidencias — aplicación autorizada para revisión en pantalla, 12 de noviembre de 2026

Roberto autorizó expresamente aplicar la migración revisada y abrir el módulo
de Johan en su instalación habitual. Fuente: `gestion-incidencias@1667778`;
ejecutor: agente de Roberto, desde `revision-incidencias-pantalla`.
Destino: CampusITSM / npjibnlxepiwfermtcmo / esquema campusitsm.

Se aplicó únicamente `20261108000100_tickets_core/migration.sql` con el comando
manual migrador. SHA256: `d0727f7f1eca862b3fe40da5859493419b98938e076e8c7741cb2466b4b4715a`,
idéntico al dictamen y las 35 comprobaciones aisladas anteriores. Antes de
aplicar: siete migraciones finalizadas y tablas de tickets ausentes.
Después: ocho migraciones con checksums coincidentes; Ticket/TicketAttachment
pertenecen a campusitsm_migrator, RLS activo, API con CRUD y sin lectura de
anon/authenticated. Conexión API en campusitsm y TLS comprobados. Ambas tablas
vacías al verificar; no se crearon tickets de prueba ni se cambiaron cuentas.

API y web reconstruidas desde `1667778`, junto a Python saludables en la única
instalación campusitsm, localhost:8080, con volúmenes conservados. Compilaciones
API/web y cinco pruebas del servicio de tickets sin red aprobadas. No se integra
la rama en main ni se aplica consentimiento/auditoría; adjuntos siguen pospuestos.
Los compañeros deben incorporar el archivo exacto al consumir Tickets. Este
registro conserva el aviso de coordinación en Git; no se enviaron mensajes al equipo.

## P20 / usuarios-modal-correcciones — publicación autorizada en main

Desde `administracion-usuarios@7ab1ed7`, correcciones y rediseño pedidos por
Roberto y código `8350650`, integrado en main por su autorización posterior.
Reutiliza AppUser, SupportTeam e IdentityDirectory/IdentityChange.
Sin tablas, columnas, índices o migraciones nuevos; no se aplicó SQL a Supabase.
Las escrituras de validación se realizaron solo en PostgreSQL descartable,
retirado al finalizar. La instalación de trabajo conserva la base compartida y
sus volúmenes. Ver [CONTRATO_USUARIOS.md](CONTRATO_USUARIOS.md).

## Permisos por rol — 11 de noviembre de 2026

Roberto solicitó y confirmó guardar permisos reales por rol mediante casillas,
manteniendo cinco roles. Rama roles-permisos, migración
20261111000100_role_permissions/migration.sql: nuevas tablas RoleAccess y
RolePermissionChange, sin modificar tablas ni datos existentes. Responsable y
ejecutor: agente de Roberto. Destino: CampusITSM / npjibnlxepiwfermtcmo /
campusitsm. Cambio de identidad común por indicación de Roberto; contrato:
[CONTRATO_ROLES_PERMISOS.md](CONTRATO_ROLES_PERMISOS.md).

**Aplicado y verificado** mediante el comando manual migrador el 11 de noviembre.
Archivo/servidor guardados en commit `9491eab`; SHA256 del SQL:
`7da2032fcc4121373d66dc9e7ef63a37a462fbcda7e5c4dc1a16b27c9c7c384a`.
Ejecutor: agente de Roberto. Antes de ejecutar se validó en PostgreSQL
descartable con 39 comprobaciones y se verificaron las seis migraciones previas,
esquema, rol API y TLS. Después: siete migraciones con checksum coincidente,
RLS activo en las dos tablas nuevas, API con lectura/inserción y sin
actualización/borrado en RolePermissionChange. Ambas tablas nuevas conservan
cero registros: no se cambiaron permisos ni usuarios de la base compartida.
Instalación campusitsm saludable tras reconstruir API/web. El código se integra
en main por autorización posterior de Roberto, sin reaplicar esta migración ni
modificar las ramas de Jasmine/Johan. Ver
[entrega](entregas/roberto-roles-permisos.md).

Los compañeros deben recibir esta base común antes de utilizar configuraciones
nuevas; sus versiones antiguas conservan valores fijos. La migración añade tablas
vacías, por lo que el comportamiento inicial no cambia.

Registro del equipo, no sustituto del historial de migraciones Prisma ni de la
auditoría de aplicación. Aplicar el procedimiento de
[COORDINACION_SUPABASE.md](COORDINACION_SUPABASE.md).

11 de noviembre, revisión `revision-incidencias`: dictamen favorable de
`20261108000100_tickets_core` en `gestion-incidencias@90a2790`, probado en
PostgreSQL descartable con 35 comprobaciones. Consulta remota solo de lectura:
seis migraciones coincidentes y tablas de tickets aún ausentes. **No aplicado**
por esta revisión; no se agrega una fila de migración aplicada. Antes de cargar
evidencia se requiere otra migración para el máximo de 5242880 bytes.
Ejecutor de revisión: agente de Roberto. Ver
[dictamen](REVISION_MIGRACION_TICKETS.md) y
[contrato de evidencias](CONTRATO_EVIDENCIAS.md). Bucket privado recomendado sin
crear; no hubo cambios de infraestructura de Storage.

11 de noviembre: `cursos-propios` añade consultas de cursos/secciones del titular
sobre AcademicCourse/AcademicSection/AcademicMembership existentes. Sin cambios
de esquema, migración, aplicación remota ni datos nuevos. Las escrituras de prueba
se hicieron exclusivamente en PostgreSQL descartable. Ver
[la entrega](entregas/roberto-semana-01-cursos-propios.md).

Transición ejecutada por solicitud de Roberto el 7 de noviembre de 2026.
Destino: CampusITSM / npjibnlxepiwfermtcmo / esquema campusitsm.
Código de implementación: `864413a`, integrado en main con identidad `8b02d6f`
por autorización de Roberto. La publicación no vuelve a ejecutar las migraciones.
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
| 2026-11-08 | Johan / incidencias Semana 1 | gestion-incidencias / 4d287c0 | 20261108000100_tickets_core/migration.sql | Ticket, TicketAttachment, índices, CHECK, acceso servidor | PostgreSQL local mediante compose.local.yml | Corte 1 de Johan; revisión del SQL por Roberto antes de cualquier aplicación compartida | Migrador local: siete migraciones sin pendientes; API y demás servicios saludables. Johan confirmó las rutas HTTP y la persistencia local del ticket. No aplicado a Supabase |

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
