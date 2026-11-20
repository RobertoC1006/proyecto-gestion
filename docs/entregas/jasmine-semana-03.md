# Entrega Semana 3 · Jasmine

## Rama y alcance

- Rama: `reportes-operativos`
- Base: `origin/main`
- Commits de privacidad/auditoría:
  - `3ae0363` — Integré main preservando privacidad y auditoría.
  - `4ae4b6b` — Implementé controles de privacidad y auditoría.
- Commit P15: `41652a7` — Implementé P15 reportes operativos.
- Alcance implementado: P15 Reportes operativos y comparación.
- No se integraron módulos de Semana 4 ni `validacion-constancias`.
- Privacidad/auditoría y Constancias conservan sus ramas independientes.

## P15 implementado

- Se añadió `GET /api/v1/reports` para conteos operativos reales de Tickets.
- Se añadió `GET /api/v1/reports/export` con los mismos filtros y alcance.
- Los filtros incluyen periodo diario/semanal/mensual, fechas, categoría, estado
  y alcance institucional o de equipo.
- Los indicadores calculan total, estados, tasa de resolución y cumplimiento
  de resolución solo cuando existen resoluciones con plazo registrado.
- Las categorías se derivan de los Tickets encontrados.
- Los valores ausentes se muestran como “no disponible”, no como cero.
- La exportación CSV no contiene datos personales ni pronósticos inventados.
- El frontend reutiliza componentes compartidos y muestra observado,
  categorías, filtros, carga, error y datos vacíos.

## Pronóstico

No existe un servicio analítico de pronóstico publicado en `main`:
`services/predictions/app.py` responde `not_implemented`.
P15 no crea ni calcula un modelo alternativo. La interfaz y exportación indican
explícitamente que el pronóstico no está disponible.

## P21, P22 y P23

- P21 — Completado y publicado en `main`: matriz real por institución/rol,
  permisos efectivos, motivos, versiones, protección de última administración
  y endpoints autorizados. Migración `20261111000100_role_permissions` ya aplicada
  y registrada por el equipo.
- P22 — Implementado y probado aisladamente en `privacidad-auditoria`: versión
  mostrada/esperada, aceptación explícita, idempotencia e institución. La ruta
  privada permite el consentimiento a usuarios autenticados; la consulta
  administrativa usa `audit:read:institution`. La migración
  `20261112000100_consent` no está acreditada como aplicada en Supabase.
- P23 — Implementado y probado aisladamente en `privacidad-auditoria`: consulta
  institucional paginada, filtros, detalle sancionado, integración con
  `TicketChange`, solo lectura y exportación CSV autorizada. Sigue pendiente
  integración a `main`.

## Pruebas

- 4 pruebas unitarias P15 aprobadas.
- 4 subpruebas HTTP P15 aprobadas sobre PostgreSQL 17 aislado.
- Se verificaron conteos reales, alcance institucional/de equipo, permisos,
  exportación, filtros inválidos y ausencia de pronóstico.
- API compilada correctamente.
- Frontend compilado correctamente.
- Prisma validado.
- OpenAPI y tipos web regenerados.
- `git diff --check` aprobado.

## Base de datos y migraciones

- No se creó migración de P15 porque reutiliza las tablas reales de Tickets.
- Las pruebas usaron PostgreSQL local aislado.
- No se aplicaron migraciones ni datos a Supabase o la base compartida.

## Dependencias reales

- Roberto debe publicar el contrato y servicio real de pronóstico observado/
  pronosticado si P15 debe añadir comparación predictiva.
- Johan debe conservar los campos reales de Ticket usados por la consulta.
- El QR, constancias y notificaciones no forman parte de P15.

## Validación visual

La interfaz P15 fue renderizada desde Vite en el entorno local con datos
interceptados únicamente para presentación. El navegador disponible mostró
renderizado responsive, filtros, KPIs, gráfico observado, categorías y aviso de
pronóstico. No se acreditó una sesión real ni una comparación automatizada
exacta contra la lámina del mockup por limitaciones de viewport/sesión.

## Estado de cierre

- Completado y verificado en P15: backend de conteos reales, alcance, filtros,
  CSV, estados de datos ausentes, pruebas unitarias/HTTP y builds.
- Completado y publicado en P21: permisos y matriz vigente en `main`.
- Implementado y probado aisladamente en P22/P23: consentimiento y auditoría
  de la rama `privacidad-auditoria`.
- Pendiente de integración: P22/P23 en `main` y aplicación coordinada de la
  migración de consentimiento.
- Bloqueado por dependencia: pronóstico observado/pronosticado de Roberto.
- Pendiente de validación real: sesión Supabase, escritorio/móvil con datos
  reales y comparación visual exhaustiva contra el mockup.
