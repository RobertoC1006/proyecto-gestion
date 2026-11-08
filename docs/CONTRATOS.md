# Contratos compartidos — base v1

Coordinación vigente: base de desarrollo común Supabase, traslado y
conexión de Roberto verificados, accesos de compañeros pendientes. Leer [COORDINACION_SUPABASE.md](COORDINACION_SUPABASE.md).
El contrato/servicio se coordina con su responsable antes de crear tablas paralelas;
las creaciones nuevas de cada módulo quedan delegadas sin permiso por tabla,
con validación, migración en Git, registro en REGISTRO_CAMBIOS_BD y aviso al equipo.
Cambios comunes o incompatibles se acuerdan antes; no borrar tablas/datos existentes.
No hace falta fusionar todo el módulo antes de aplicar una migración ordinaria delegada.

Actualización de rama del 7 de noviembre: identidad-supabase implementa el acceso,
registro y recuperación por enlace, sesión opaca y autorización común, con proyecto
real configurado. Los detalles vigentes están en [CONTRATO_IDENTIDAD.md](CONTRATO_IDENTIDAD.md).
No acreditar su integración en main hasta que Roberto la autorice.

La entrega aprobada de calendario/base visual se integró por PR #2. Su contrato
está en [CONTRATO_CALENDARIO.md](CONTRATO_CALENDARIO.md). Las rutas académicas
siguen cerradas sin sesión. La rama de identidad implementa sesión/directorio/roles
según [CONTRATO_IDENTIDAD.md](CONTRATO_IDENTIDAD.md), con integración en main autorizada y completada junto con la transición Supabase.

## Disponible

Origen único del navegador: `http://localhost:8080`, prefijo `/api/v1`.
Contrato generado por NestJS: `/api/openapi.json`, interfaz `/api/docs`.
Los contratos futuros se generan desde DTO OpenAPI, sin copiar modelos Prisma al navegador.

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
eventos y AcademicChange. Identidad añade AppUser, sesiones, flujos y cambios de
acceso en su rama; tickets siguen pendientes. El UUID canónico ya es el sujeto de
Supabase. Estas tablas ya están en el esquema común campusitsm; no duplicarlas.

## Propuestas pendientes de coordinación, no implementadas

Fechas ISO UTC; UUID; paginación `page` ≥1 y `pageSize` 1–100 con respuesta
`{items,total,page,pageSize}`. Errores de dominio `{code,message,fields?}`:
400 validación, 401 sin sesión, 403 sin permiso, 404 objeto no visible, 409 conflicto.
Se incorporarán al OpenAPI al implementar los controladores.

| Responsable | Rutas reservadas propuestas | Datos/dependencias por acordar |
| --- | --- | --- |
| Roberto | `/auth/login`, `/auth/logout`, `/auth/me` | Supabase Auth, sesión, CSRF, usuario canónico, rol, permisos, institución/equipo y autorización por objeto |
| Jasmine | `/users` y administración/consentimiento | Perfiles/estado/equipo y P20/P21 sobre servicios de identidad/autorización de Roberto; consentimiento y auditoría propios |
| Johan | `/tickets`, `/tickets/{id}` | Titular/equipo, título, descripción, adjuntos, estado/clasificación separados, U/I, factor/motivo, prioridad, plazos e historial |
| Roberto | `/academic/courses`, `/academic/sections`, `/academic/events`, `/academic/context` | Asociaciones explícitas; tipo/inicio/fin/alcance/fuente; usuario/curso/instante para contexto |
| Roberto | `/configuration/sla` | Versión/vigencia/motivo, sin reiniciar relojes de tickets |
| Jasmine | `/certificates`, `/public/certificates/{code}` | Elegibilidad, emisión idempotente, PDF privado, verificación mínima y de archivo |
| Roberto | `/analytics/series`, `/analytics/forecasts`, `/analytics/evaluations` | Periodo/unidad/fuente real o sintética, modelo, generación, capacidad, disponible/no disponible |
| Roberto | `/notifications`, `/notifications/{id}/read`, `/events` | Destinatario autorizado, tipo/objeto/lectura; SSE y reconsulta al reconectar |
| Jasmine | `/audit`, `/reports` | Auditoría inmutable por aplicación; consultas/reportes autorizados sobre servicios comunes |

Estas rutas propuestas no responden éxitos simulados. Roberto publica identidad
y autorización; Jasmine administración/consentimiento/auditoría; Johan tickets y
evolución de componentes. Las rutas académicas efectivas constan en OpenAPI y su
contrato propio; `/academic/context` sigue siendo propuesta de semana 2.
Ninguna vista puede sustituir autorización del backend.
