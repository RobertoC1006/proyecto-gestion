# Contratos compartidos — base v1

Avance exclusivo de la rama `calendario-academico`: contrato del calendario manual
en [CONTRATO_CALENDARIO.md](CONTRATO_CALENDARIO.md). No integrado en main ni abierto
sin sesión; los adaptadores de identidad/directorio siguen pendientes de Jasmine.

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

No se coordinaron modelos de identidad/tickets con compañeros en esta sesión.
Su implementación queda pendiente; la infraestructura ya permite construirla.

## Propuestas pendientes de coordinación, no implementadas

Fechas ISO UTC; UUID; paginación `page` ≥1 y `pageSize` 1–100 con respuesta
`{items,total,page,pageSize}`. Errores de dominio `{code,message,fields?}`:
400 validación, 401 sin sesión, 403 sin permiso, 404 objeto no visible, 409 conflicto.
Se incorporarán al OpenAPI al implementar los controladores.

| Responsable | Rutas reservadas propuestas | Datos/dependencias por acordar |
| --- | --- | --- |
| Jasmine | `/auth/login`, `/auth/logout`, `/auth/me`, `/users` | Sesión HttpOnly, CSRF, usuario, rol, permisos, equipo, consentimiento y autorización por objeto |
| Johan | `/tickets`, `/tickets/{id}` | Titular/equipo, título, descripción, adjuntos, estado/clasificación separados, U/I, factor/motivo, prioridad, plazos e historial |
| Roberto | `/academic/courses`, `/academic/sections`, `/academic/events`, `/academic/context` | Asociaciones explícitas; tipo/inicio/fin/alcance/fuente; usuario/curso/instante para contexto |
| Roberto | `/configuration/sla` | Versión/vigencia/motivo, sin reiniciar relojes de tickets |
| Jasmine | `/certificates`, `/public/certificates/{code}` | Elegibilidad, emisión idempotente, PDF privado, verificación mínima y de archivo |
| Roberto | `/analytics/series`, `/analytics/forecasts`, `/analytics/evaluations` | Periodo/unidad/fuente real o sintética, modelo, generación, capacidad, disponible/no disponible |
| Roberto | `/notifications`, `/notifications/{id}/read`, `/events` | Destinatario autorizado, tipo/objeto/lectura; SSE y reconsulta al reconectar |
| Jasmine | `/audit`, `/reports` | Auditoría inmutable por aplicación; consultas/reportes autorizados sobre servicios comunes |

Estas rutas no responden éxitos simulados. Antes de integrar: Jasmine valida
identidad/equipo/auditoría; Johan tickets/componentes/consumo de contexto; Roberto
versiona esquema y contratos. Ninguna vista puede sustituir autorización del backend.
