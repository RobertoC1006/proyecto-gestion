# CampusITSM — contexto compartido

Mesa de ayuda académica para la Universidad Privada Tallán, institución ficticia.
Equipo: Roberto, Johan y Jasmine. Cada integrante hace frontend, backend y pruebas.
Los acuerdos están en `MEMORIA_PROYECTO.md` y `planes/`; la memoria es una fotografía
histórica. El avance actual se consulta en `docs/ESTADO_EQUIPO.md` y las entregas.

## Estructura y stack único

- `apps/web`: React/Vite/TypeScript, vistas recuperadas de `front-vistas`, incluidos
  `AppHeader`, `Sidebar`, `PriorityBadge` y ejemplos. Siguen siendo demostrativas:
  no son autenticación, tickets ni constancias reales.
- `apps/api`: una API modular NestJS, prefijo `/api/v1`, Prisma y OpenAPI.
  Una instancia Prisma compartida mediante `DatabaseModule`.
- `apps/api/prisma`: único esquema y migraciones, coordinados por Roberto.
- `services/predictions`: Python interno, por ahora solo salud, sin modelo.
- `diseno/campusitsm`: mockups finales; `planes`: responsabilidades y semanas.

Docker incluye PostgreSQL, backend/API, Python y frontend. Solo web publica
puerto local y reenvía `/api/` al backend. DB y Python quedan en red interna.
Imágenes oficiales fijadas por digest; dependencias Node bloqueadas con archivos
`package-lock.json` y `npm ci`. Python usa solo biblioteca estándar en esta base.
pg-boss se incorporará con tareas persistentes; no añadir Redis.

React Router, TanStack Query y Recharts se incorporan por los responsables de sus
consumidores. Esta recuperación no crea otra navegación ni otra familia de controles.

## Responsables

| Persona | Propiedad |
| --- | --- |
| Roberto | Base Docker, esquema/contratos, calendario/configuración, predicción y notificaciones |
| Johan | Componentes/navegación compartidos, incidencias, prioridad, atención y clasificación |
| Jasmine | Identidad/permisos, usuarios, auditoría/privacidad, constancias y reportes |

Esta entrega es infraestructura. No implementa los servicios de compañeros ni el
calendario. Identidad y tickets requieren coordinación antes de crear sus entidades.

## Reglas comunes

- Una rama por módulo con nombre normal, sin `codex/`. Integrar verificado en
  `main` antes de borrar únicamente la rama propia integrada; conservar ramas ajenas.
- Reutilizar servicios y componentes; no duplicar catálogos, esquemas ni reglas.
- Roles: estudiante, docente, ti_agente, ti_supervisor y administrador. La API
  autoriza por rol y objeto; el selector de la demo no otorga permisos reales.
- Sesiones en PostgreSQL, cookies HttpOnly y protección de escrituras al desarrollar
  identidad. No guardar credenciales ni datos de negocio en localStorage.
- Fechas UTC, presentación `America/Lima`. Archivos privados en volumen.
- Puntaje = urgencia × impacto × máximo factor aplicable al usuario/curso.
  P1 ≥9; P2 ≥5 y <9; P3 ≥3 y <5; P4 <3. Factores 1 / 1,5 / 1,7 / 2 según plan.
  Respuesta/resolución: P1 15 min/2 h; P2 1 h/4 h; P3 4 h/24 h; P4 8 h/72 h.
- Estados: registrado, clasificado, en_atencion, resuelto. Clasificación y falla
  confirmada se conservan aparte. Primera respuesta significa atención humana.
- Constancias: ticket resuelto y falla confirmada, emisión idempotente, PDF/QR real,
  consulta pública mínima y comprobación del archivo; sin firma certificada.
- Clasificación IA y pronóstico son distintos. Consultar a Roberto por proveedor
  al llegar al módulo; no elegir ni contratar anticipadamente.
- No presentar ejemplos, datos sintéticos o metas como resultados reales.
- Los mockups finales verde/menta son referencia de implementación. Recuperar las
  vistas antiguas no acredita fidelidad visual ni funcionalidad.

## Operación

Ver `README.md`. Migraciones con `prisma migrate deploy`; nunca editar una aplicada
ni usar `db push` como entrega. Esquema inicial solo institución/equipo.
Contratos disponibles y propuestas por coordinar: `docs/CONTRATOS.md`.
Primera versión local, una institución/equipo; sin publicación pública,
conexión institucional, correo ni firma digital certificada.
