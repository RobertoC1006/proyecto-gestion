# Contratos compartidos — base v1

P20 integrado en main por autorización de Roberto, preparado en
`usuarios-modal-correcciones` desde la entrega
de Jasmine `administracion-usuarios@7ab1ed7`: listado y edición modal con
tarjetas de rol/equipo, switch de acceso y validación de entradas. Contrato:
[CONTRATO_USUARIOS.md](CONTRATO_USUARIOS.md). Conserva la identidad común,
sin migraciones nuevas. Ver [publicación](entregas/roberto-publicacion-usuarios.md).

Coordinación vigente: base de desarrollo común Supabase, traslado y
conexión de Roberto verificados. Johan confirmó que aceptó su invitación
Developer; los documentos del repositorio aún no verifican el acceso y la
configuración privada de cada integrante. Leer [COORDINACION_SUPABASE.md](COORDINACION_SUPABASE.md).
El contrato/servicio se coordina con su responsable antes de crear tablas paralelas;
las creaciones nuevas de cada módulo quedan delegadas sin permiso por tabla,
con validación, migración en Git, registro en REGISTRO_CAMBIOS_BD y aviso al equipo.
Cambios comunes o incompatibles se acuerdan antes; no borrar tablas/datos existentes.
No hace falta fusionar todo el módulo antes de aplicar una migración ordinaria delegada.
Para tickets de Semana 1, Johan puede crear la migración y validarla en
PostgreSQL local. Roberto revisa su SQL antes de aplicarla a la base compartida;
esa revisión no exige terminar ni fusionar el módulo completo.

Roberto autorizó e integró en `main` la identidad Supabase y la transición de
base compartida el 7 de noviembre de 2026. El historial incluye `8b02d6f`
(identidad), `864413a` (transición) y la publicación `69a6907`. Los detalles
vigentes están en [CONTRATO_IDENTIDAD.md](CONTRATO_IDENTIDAD.md).

La entrega aprobada de calendario/base visual se integró por PR #2. Su contrato
está en [CONTRATO_CALENDARIO.md](CONTRATO_CALENDARIO.md). Las rutas académicas
requieren sesión. Identidad, directorio y roles comunes ya están en `main` según
[CONTRATO_IDENTIDAD.md](CONTRATO_IDENTIDAD.md).

## Disponible

Prioridad vigente del primer avance: acceso, registro/consulta de tickets,
calendario manual y administración básica validada. Adjuntos/Storage pospuestos;
no son requisito para avanzar el núcleo. Ver [PRIMER_AVANCE.md](PRIMER_AVANCE.md).

Revisión del 11 de noviembre preparada en `revision-incidencias`, sin integrar
todavía en main: [dictamen de la migración de tickets](REVISION_MIGRACION_TICKETS.md)
y [contrato de evidencias](CONTRATO_EVIDENCIAS.md). El núcleo de Johan tiene
revisión favorable; la carga de archivos y el bucket recomendado siguen sin
implementar/habilitar. Las rutas de archivos descritas son contrato futuro.

Origen único del navegador: `http://localhost:8080`, prefijo `/api/v1`.
Contrato generado por NestJS: `/api/openapi.json`, interfaz `/api/docs`.
Los contratos futuros se generan desde DTO OpenAPI, sin copiar modelos Prisma al navegador.

Ampliación del 11 de noviembre, implementada en `cursos-propios` e integrada en main: GET
`/academic/me/courses` y `/academic/me/sections?courseId=…`, con sesión y alcance
del titular. Reutilizan el esquema existente, sin migración. Contrato para Johan:
[CONTRATO_CURSOS_PROPIOS.md](CONTRATO_CURSOS_PROPIOS.md). Su disponibilidad en main
se verifica en [ESTADO_EQUIPO.md](ESTADO_EQUIPO.md).

`GET /api/v1/health` público, exclusivamente infraestructura:

```json
{"status":"ok","service":"campusitsm-api","database":"ok","predictions":"ok"}
```

200 después de consultar PostgreSQL y salud Python. Si falla una dependencia:
503 con `status: unavailable`, `code: DEPENDENCY_UNAVAILABLE`, sin detalles internos.
`GET /health` de web comprueba Nginx; la salud integral es la de API.
`GET http://predictions:8000/health` solo interno, indica `model: not_implemented`.
No hay rutas de pronóstico. Rutas API desconocidas responden 404.

## Esquema inicial

- `Institution`: UUID, código único no vacío, nombre no vacío, creación UTC.
- `SupportTeam`: UUID, institución existente, código único por institución y nombre
  no vacío. No se elimina institución con equipos asociados.
- Semilla explícita `UPT-DEMO` / `TI-DEMO`, identificadores constantes ficticios.
  No crea usuarios, concede permisos ni expone endpoints de esas tablas.

El esquema académico ya amplía esta base con cursos, secciones, asociaciones,
eventos y AcademicChange. La identidad integrada incluye AppUser, sesiones,
flujos y cambios de acceso. Johan implementó el núcleo de tickets de Semana 1
según [CONTRATO_TICKETS_SEMANA_01.md](CONTRATO_TICKETS_SEMANA_01.md); su migración
se aplicó solo en PostgreSQL local y espera revisión de Roberto antes de la base
compartida. El UUID canónico ya es el sujeto de Supabase. Las
tablas comunes están en campusitsm; no duplicarlas.

## Contratos disponibles y propuestas pendientes

Fechas ISO UTC; UUID; paginación `page` ≥1 y `pageSize` 1–100 con respuesta
`{items,total,page,pageSize}`. Errores de dominio `{code,message,fields?}`:
400 validación, 401 sin sesión, 403 sin permiso, 404 objeto no visible, 409 conflicto.
Los controladores disponibles ya constan en OpenAPI; las rutas pendientes se
incorporarán al implementar sus módulos.

| Responsable | Rutas | Estado y dependencias |
| --- | --- | --- |
| Roberto | `/auth/login`, `/auth/logout`, `/auth/me` | Disponibles en main: Supabase Auth, sesión, CSRF, usuario canónico, rol, permisos, institución/equipo y autorización por objeto |
| Jasmine | `/users` y administración/consentimiento | Perfiles/estado/equipo y P20/P21 sobre servicios de identidad/autorización de Roberto; consentimiento y auditoría propios |
| Johan | `/tickets`, `/tickets/{id}` | Backend disponible localmente: creación, listado y detalle propio con descripción, servicio, alcance y estados iniciales. P02–P05 consumen estas rutas; P03 solo puede seleccionar alcance general hasta acordar consulta académica propia. Captura opcional pendiente de contrato. Prioridad, atención e historial completo son posteriores. Ver [entrega a Roberto y Jasmine](entregas/johan-semana-01-corte-03.md) |
| Johan | `GET /api/v1/tickets/services` | Identificadores de servicios de TI de una lista local provisional del módulo de incidencias; Roberto puede sustituirla por su catálogo canónico antes de aplicar la migración compartida. No crea una tabla o catálogo paralelo |
| Roberto | `/academic/courses`, `/academic/sections`, `/academic/events`, `/academic/context` | Las consultas de cursos y secciones actuales exigen administración. P03 necesita acordar una consulta de cursos/secciones propios autorizada para estudiante/docente; no crear un catálogo paralelo. `/academic/context` sigue pendiente |
| Roberto | `/configuration/sla` | Versión/vigencia/motivo, sin reiniciar relojes de tickets |
| Jasmine | `/certificates`, `/public/certificates/{code}` | Elegibilidad, emisión idempotente, PDF privado, verificación mínima y de archivo |
| Roberto | `/analytics/series`, `/analytics/forecasts`, `/analytics/evaluations` | Periodo/unidad/fuente real o sintética, modelo, generación, capacidad, disponible/no disponible |
| Roberto | `/notifications`, `/notifications/{id}/read`, `/events` | Destinatario autorizado, tipo/objeto/lectura; SSE y reconsulta al reconectar |
| Jasmine | `/audit`, `/reports` | Auditoría inmutable por aplicación; consultas/reportes autorizados sobre servicios comunes |

Las rutas pendientes no responden éxitos simulados. Roberto ya publicó identidad
y autorización; Jasmine prepara consentimiento/auditoría; Johan prepara tickets y
evolución de componentes. Las rutas académicas efectivas constan en OpenAPI y su
contrato propio; `/academic/context` sigue siendo propuesta de semana 2.
Ninguna vista puede sustituir autorización del backend.
