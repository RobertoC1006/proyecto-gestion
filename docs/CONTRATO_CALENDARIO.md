# Calendario manual — contrato de rama v1

Rama `calendario-academico`, derivada de `196a2144aae253ca672eeeaf721c62204516245a`.
Entrega aprobada para integrar mediante PR #2. Semana 1: calendario manual P17/P18; CSV, configuración de
factores/SLA y cálculo del factor corresponden a semana 2.

Ampliación del 11 de noviembre, implementada en `cursos-propios` e integrada en
main por autorización de Roberto: consulta de cursos y secciones
del titular para incidencias. Ver [CONTRATO_CURSOS_PROPIOS.md](CONTRATO_CURSOS_PROPIOS.md)
y [ESTADO_EQUIPO.md](ESTADO_EQUIPO.md).

## Identidad y auditoría: dependencias explícitas

Identidad y base compartida están integradas en main desde el 7 de noviembre.
`AcademicIdentity` y `AcademicDirectory` usan la sesión y los perfiles canónicos
reales de NestJS/Supabase. `resolve(request)` devuelve
`{id,institutionId,role,csrfVerified}` y solo valida CSRF desde la protección del
servidor. Sin sesión responde 401; no acepta identidad o permisos inventados en
cabeceras/cookies/cuerpo del cliente. No añadir otro adaptador de administrador.

Administración: rol administrador. Las consultas personales de eventos, cursos y
secciones se limitan al titular. Identificadores UUID; institución del principal,
nunca del cuerpo. Ver `CONTRATO_IDENTIDAD.md`. Las asociaciones se validan contra
AppUser activo de la misma institución mediante el directorio común; no se crean
usuarios paralelos. La base Supabase común ya está trasladada y conectada para
Roberto; accesos de compañeros según [COORDINACION_SUPABASE.md](COORDINACION_SUPABASE.md).

Cada escritura guarda actor, fecha, origen manual, motivo y antes/después en
`AcademicChange`, en la misma transacción. Es un registro pendiente de entrega al
servicio de auditoría de Jasmine, sin rutas de edición/borrado ni segundo servicio
de auditoría global. Su integración final queda pendiente.

## Rutas bajo `/api/v1/academic`

| Método/ruta | Capacidad y permisos |
| --- | --- |
| GET/POST `courses` | Listar/crear cursos; administrador |
| GET/POST `sections` | Listar/crear secciones de un curso; administrador |
| POST `memberships` | Asociar usuario validado a sección; administrador |
| DELETE `memberships/{sectionId}/{subjectId}` | Retirar asociación; administrador |
| GET/POST `events` | Listar/crear eventos; administrador |
| GET/PATCH/DELETE `events/{id}` | Consultar/editar/eliminar evento; administrador |
| GET `me/events` | Eventos institucionales y de cursos/secciones asociados al titular |
| GET `me/courses` | Cursos asociados al titular, sin duplicados; ampliación en cursos-propios |
| GET `me/sections?courseId=…` | Solo secciones propias del curso indicado; ampliación en cursos-propios |

Listados de cursos/secciones: `page` (1), `pageSize` (100, máximo 100), respuesta
`{items,total,page,pageSize}`. Secciones admiten `courseId`.
Las consultas personales de catálogos tienen parámetros y reglas específicos
en [CONTRATO_CURSOS_PROPIOS.md](CONTRATO_CURSOS_PROPIOS.md); `courseId` es obligatorio
al consultar secciones propias.
Eventos: mismos campos de paginación, `from` inclusivo y `to` exclusivo ISO con
offset obligatorio, intervalo máximo 93 días; filtros `courseId`, `sectionId`,
`type` (examen/entrega/matricula). Fuente única `manual` en esta etapa.
Eventos que se solapan con el intervalo, ordenados por inicio e ID.

Evento: `{title,type,scope,courseId?,sectionId?,startsAt,endsAt,reason}`.
Tipos examen/entrega/matricula; alcance institution/course/section. Institucional
no admite curso/sección; curso requiere solo curso; sección requiere ambos.
Fin estrictamente posterior al inicio. Respuesta añade id, institutionId, source,
version, createdAt, updatedAt y nombres de curso/sección, sin datos de personas.
PATCH envía el evento completo más `expectedVersion`; DELETE cuerpo
`{expectedVersion,reason}`. Conflictos devuelven 409 para evitar perder cambios.

Curso: `{code,name,reason}`. Sección: `{courseId,code,name,reason}`.
Asociación: `{sectionId,subjectId,reason}`. Motivo obligatorio 5–500 caracteres.
Nunca deducir asociaciones del texto de incidencias. Los consumidores internos
pueden usar `AcademicService.applicableEvents(principal,query)` para el usuario
validado del ticket; la ruta de usuario nunca permite elegir otro titular.

Errores `{code,message,fields?}`: 400 validación con campo concreto, 401 sesión,
403 permiso/protección de escritura, 404 objeto no visible, 409 versión/código
duplicado y 503 directorio de usuarios sin integrar. OpenAPI refleja DTO y rutas.
Guardar en UTC, capturar/mostrar en America/Lima; el navegador no calcula prioridad.
