# CampusITSM — contexto compartido

Mesa de ayuda académica para la Universidad Privada Tallán, institución ficticia.
Equipo: Roberto, Johan y Jasmine. Cada integrante hace frontend, backend y pruebas.
Los acuerdos están en `MEMORIA_PROYECTO.md` y `planes/`; la memoria es una fotografía
histórica. El avance actual se consulta en `docs/ESTADO_EQUIPO.md` y las entregas.

Acuerdo vigente del 7 de noviembre: una misma base de desarrollo PostgreSQL en
Supabase para Roberto/Johan/Jasmine, con sus frontend/backend/Python en Docker y
colaboradores con acceso revisado. La estructura y datos ya están en el esquema campusitsm; Roberto está conectado.
El Compose normal no inicia PostgreSQL ni aplica migraciones. Accesos de compañeros pendientes.
Leer [COORDINACION_SUPABASE.md](docs/COORDINACION_SUPABASE.md) antes de modificar
conexiones o esquema. Los tres escriben migraciones de sus módulos; Roberto
coordina aplicación y compatibilidad. PostgreSQL local queda para pruebas aisladas.

## Estructura y stack único

Diseño compartido aprobado por Roberto y entregado mediante PR #2: componentes,
fuentes DM Sans/Manrope e iconos Phosphor portados de `RobertoC1006/casos-gestion`,
adaptados a la estructura y funciones de los mockups de CampusITSM. Ver
`docs/DISENO_COMPONENTES.md`. No añadir una segunda familia de controles.

- `apps/web`: React/Vite/TypeScript, vistas recuperadas de `front-vistas`, incluidos
  `AppHeader`, `Sidebar` y `PriorityBadge`. La rama identidad-supabase conecta P01
  a acceso real y cabecera con sesión. Las vistas de tickets/constancias siguen
  siendo demostrativas y pertenecen a los módulos de sus responsables.
- `apps/api`: una API modular NestJS, prefijo `/api/v1`, Prisma y OpenAPI.
  Una instancia Prisma compartida mediante `DatabaseModule`.
- `apps/api/prisma`: único esquema y migraciones, coordinados por Roberto.
- `services/predictions`: Python interno, por ahora solo salud, sin modelo.
- `diseno/campusitsm`: mockups finales; `planes`: responsabilidades y semanas.

Docker ejecuta backend/API, Python y frontend; PostgreSQL de trabajo está en Supabase. Solo web publica
puerto local y reenvía `/api/` al backend. Python y PostgreSQL opcional de pruebas quedan internos.
Cada computadora usa una sola instalación de trabajo `campusitsm`, en 8080.
Los avances de la rama activa se revisan reconstruyendo esa instalación con sus
volúmenes existentes; no se crea otra aplicación Compose por módulo/revisión.
Las ramas Git se integran en main únicamente cuando Roberto lo autorice.
La transición retiró PostgreSQL del arranque de trabajo, conservó sus volúmenes
y separó las migraciones del arranque. Ver docs/OPERACION_SUPABASE.md.
Una rama Git no aísla Supabase: los cambios allí aplicados afectan al equipo.
Imágenes oficiales fijadas por digest; dependencias Node bloqueadas con archivos
`package-lock.json` y `npm ci`. Python usa solo biblioteca estándar en esta base.
pg-boss se incorporará con tareas persistentes; no añadir Redis.

React Router y TanStack Query ya están incorporados. Recharts se añadirá al
implementar gráficos reales. Reutilizar una sola navegación y familia de controles.

## Responsables

| Persona | Propiedad |
| --- | --- |
| Roberto | Base Docker/esquema/contratos, P01, Supabase Auth y autorización común; calendario/configuración, predicción y notificaciones |
| Johan | Componentes/navegación compartidos, incidencias, prioridad, atención y clasificación |
| Jasmine | Administración de usuarios/permisos usando la identidad de Roberto; consentimiento/auditoría/privacidad, constancias y reportes |

La base incluye infraestructura, componentes visuales y calendario manual P17/P18.
La entrega de identidad añade P01, registro/login reales y autorización común,
conecta sus puertos y mantiene el cierre sin sesión/permisos. Ya está integrada en
main junto con la base Supabase, por autorización de Roberto. Ver `docs/CONTRATO_IDENTIDAD.md` y `docs/ESTADO_EQUIPO.md`.

## Reglas comunes

- Una rama por módulo con nombre normal, sin `codex/`. Integrar verificado en
  `main` antes de borrar únicamente la rama propia integrada; conservar ramas ajenas.
- Reutilizar servicios y componentes; no duplicar catálogos, esquemas ni reglas.
- Roles: estudiante, docente, ti_agente, ti_supervisor y administrador. La API
  autoriza por rol y objeto; el registro propio no permite seleccionar privilegios.
- Supabase Auth gestiona credenciales. Sesión de servidor con cookies HttpOnly,
  tokens cifrados y protección de escrituras según el contrato de identidad.
  No guardar tokens, credenciales ni datos de negocio en localStorage.
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
ni usar `db push` como entrega. Esquema de institución/equipo y módulo académico.
Contratos disponibles y propuestas por coordinar: `docs/CONTRATOS.md`.
Registrar cambios en `docs/REGISTRO_CAMBIOS_BD.md`. Las creaciones nuevas de cada
módulo, compatibles y validadas, están delegadas sin permiso por tabla tras habilitar
el entorno; consultar cambios comunes o incompatibles. Pueden aplicarse antes de
integrar el módulo completo; conservar archivo/commit exactos y avisar al equipo.
Primera versión local, una institución/equipo; sin publicación pública,
conexión institucional, correo ni firma digital certificada.
