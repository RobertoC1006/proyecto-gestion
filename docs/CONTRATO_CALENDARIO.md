# Calendario manual — contrato de rama v1

Rama `calendario-academico`, derivada de `196a2144aae253ca672eeeaf721c62204516245a`.
Entrega aprobada para integrar mediante PR #2. Semana 1: calendario manual P17/P18; CSV, configuración de
factores/SLA y cálculo del factor corresponden a semana 2.

## Identidad y auditoría: dependencias explícitas

No hay identidad implementada. `AcademicIdentity` es el único punto de integración:
Roberto debe proporcionar `resolve(request)` mediante su integración Supabase Auth y devolver
`{id,institutionId,role,csrfVerified}`. `csrfVerified` solo es true tras validar la
protección de escritura en el servidor. El adaptador predeterminado devuelve null:
todas las rutas académicas responden 401. No acepta roles, usuarios ni permisos
desde cabeceras, cookies inventadas o cuerpo del navegador.

Administración: rol administrador; otras cuentas solo consultan sus propios
eventos con `/academic/me/events`. Identificadores UUID; institución del principal,
nunca del cuerpo. Contrato de integración para Roberto/Supabase Auth, no identidad
implementada todavía. Ver `CONTRATO_IDENTIDAD.md`. Los sujetos de asociaciones se validan
mediante `AcademicDirectory`; por defecto no disponible (503). No se crean tablas
de usuarios ni cuentas ficticias. El directorio debe verificar usuario/institución.

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

Listados de cursos/secciones: `page` (1), `pageSize` (100, máximo 100), respuesta
`{items,total,page,pageSize}`. Secciones admiten `courseId`.
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
