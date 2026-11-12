# Entrega de Jasmine — Semana 1

## Estado de esta entrega

Esta documentación describe únicamente el alcance de la Semana 1 de
CampusITSM. No incluye exportaciones, anonimización avanzada, reportes
analíticos ni otras funcionalidades de semanas posteriores.

La rama de trabajo es `privacidad-auditoria`. El remoto conserva
`origin/privacidad-auditoria` en `27cfb90` (`Implementé consentimiento y
auditoría institucional`). El checkout local está un commit por delante, en
`826abbb` (`Mejoré el diagnóstico de errores al iniciar la API`), y además
contiene una corrección local de accesibilidad en la pantalla de permisos
descrita más abajo. No se realizó commit ni push de esos cambios locales.

## Objetivo y alcance

La Semana 1 entrega la base de gobierno de acceso y privacidad:

- P20: administración institucional de usuarios, perfiles, roles, estado y
  equipo, reutilizando la identidad y autorización existentes.
- Consentimiento explícito, versionado e idempotente, con fecha UTC generada
  por el servidor.
- Auditoría institucional de solo lectura, con fuentes unificadas,
  aislamiento por institución, filtros y paginación global.
- Vistas iniciales P22 (Consentimientos) y P23 (Auditoría), con estados de
  carga, error, vacío y acceso denegado.

## P20 — Usuarios, perfiles, roles, estado y equipo

P20 ya estaba integrado en `main` y se reutiliza sin duplicar el directorio.
Las rutas están protegidas por `CampusSessionGuard` y `users:manage`. Las
consultas se restringen a la institución de la sesión y no aceptan la
institución ni el actor desde el cliente.

`IdentityDirectory.changeAccess` centraliza los cambios sensibles y:

- valida rol, estado, equipo, versión esperada y motivo;
- verifica nuevamente al administrador dentro de una transacción;
- impide desactivar o quitar privilegios al último administrador activo;
- comprueba que el equipo pertenezca a la institución;
- registra `IdentityChange` de forma atómica;
- incrementa `accessVersion` para invalidar sesiones anteriores.

La corrección local en
`apps/web/src/features/permissions/RolePermissionsPage.tsx` evita mostrar
simultáneamente el mensaje de guardado y el estado de carga durante una
recarga de la matriz de permisos. No cambia las reglas de autorización.

## Consentimiento

Se añadieron los modelos `ConsentVersion` y `ConsentAcceptance` y la
migración aditiva:

`apps/api/prisma/migrations/20261112000100_consent/migration.sql`

La migración incluye claves foráneas, unicidad por usuario y versión, índices
por institución/usuario/fecha y protección de modificaciones de aceptaciones
desde el rol de API cuando está disponible.

Endpoints implementados:

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/api/v1/consent/current` | Sesión válida |
| GET | `/api/v1/consent/me` | Sesión válida |
| POST | `/api/v1/consent/accept` | Sesión válida |

La aceptación requiere acción explícita. El servidor obtiene de la sesión el
usuario y la institución, selecciona la versión vigente, genera la fecha en
UTC y trata los reintentos de la misma versión como idempotentes. No solicita
motivo para aceptar.

## Auditoría institucional

Endpoint implementado:

`GET /api/v1/audit`

Requiere `audit:read:institution`. El servidor combina, sin duplicar
historiales, estas fuentes:

- `AcademicChange`;
- `IdentityChange`;
- `RolePermissionChange`;
- `ConsentAcceptance`.

Los resultados se aíslan por `institutionId`, se ordenan y se filtran después
de unificar las fuentes para mantener una paginación global coherente.
Admite fecha inicial/final, actor, tipo e identificador de objeto, acción,
página y tamaño de página. Los detalles antes/después se sanitizan para no
exponer contraseñas, tokens, secretos, correos, adjuntos ni contenido privado
completo. La API no ofrece edición ni eliminación de registros.

P23 incluye filtros, tabla, detalle y paginación inicial. No incluye
exportaciones ni anonimización avanzada.

## Interfaz P22/P23

La pantalla de privacidad reutiliza `ui.tsx`, `Card`, `Field`, `Select`,
`Notice`, `PageHeading` y la navegación/autorización existentes. P22 muestra
la versión vigente y el estado de aceptación del usuario autenticado. P23
muestra filtros, tabla de auditoría, orden temporal, detalle antes/después,
paginación y estados de carga, error, vacío y acceso denegado.

La interfaz no implementa todavía la administración de versiones ni un
listado administrativo de todas las aceptaciones, porque no forman parte de
los endpoints aprobados para esta Semana 1.

El filtro de fechas de P23 conserva el valor local visible del control
`datetime-local` y lo convierte a UTC únicamente al consultar la API. Las
filas de auditoría también permiten abrir el detalle con teclado.

## Cobertura de los requisitos de Semana 1

| Requisito del plan | Estado verificable |
| --- | --- |
| P20 administra perfiles, estado y equipo | Cubierto por implementación heredada y pruebas de Usuarios |
| Aislamiento y rechazo de cuentas ajenas | Cubierto por pruebas API y E2E |
| Servicio central y protección del último administrador | Cubierto por `IdentityDirectory.changeAccess` y pruebas API/E2E |
| Consentimiento explícito con versión e instante | Cubierto por API, migración y `test:privacy` |
| Auditoría con actor, acción, objeto, cambios y eventos académicos | Cubierto por fuentes unificadas y pruebas de privacidad; integración académica validada en `test:academic` |
| Estados visuales y componentes vigentes | Cubierto por build y E2E local; P22/P23 real con Supabase aún no verificado |

## Validación de base de datos

Se utilizó una PostgreSQL descartable en Docker, conectada mediante una red
interna temporal. No se usaron Supabase ni la base compartida.

Resultado registrado:

- Las ocho migraciones se aplicaron correctamente, incluida
  `20261112000100_consent`.
- Se comprobaron tablas, relaciones, claves únicas, índices y restricciones
  de consentimiento.
- El contenedor y la red temporales se eliminaron al finalizar.

## Pruebas ejecutadas

Las suites de API se ejecutaron contra la PostgreSQL aislada:

| Comando | Resultado |
| --- | --- |
| `npm run test:academic` | 8 pasaron |
| `npm run test:users` | 11 pasaron |
| `npm run test:auth` | 30 pasaron |
| `npm run test:privacy` | 3 pasaron |

La prueba específica de privacidad ahora contiene cuatro aserciones: aceptación
idempotente, aislamiento/permisos/paginación y sanitización de claves sensibles
anidadas y motivos privados. Pasó completa en PostgreSQL aislado.

La primera ejecución de autenticación no fue válida porque se proporcionó al
contenedor un `AUTH_INSTITUTION_CODE` distinto del usado por sus fixtures. Se
repitió con `AUTH-TEST`, que es la configuración contractual de la suite, y
pasó completa. No se consideró el primer resultado como fallo del código.

Validaciones de frontend:

- `npm run build`: pasó TypeScript y Vite.
- `npm run test:e2e` pasó 41/41 contra el contenedor web reconstruido en
  `http://localhost:8080`, incluyendo P20, permisos, aislamiento visual y
  estados de acceso.

## Compilaciones

- API: `apps/api`, `npm run build`, aprobado.
- Frontend: `apps/web`, `npm run build`, aprobado después de la corrección
  local de permisos.

## Ramas y archivos principales

Ramas verificadas:

- `main`: `4855a10`, publicado.
- `administracion-usuarios`: `7ab1ed7`, publicado; no fue modificada.
- `privacidad-auditoria`: `origin` en `27cfb90`; checkout local en `826abbb`
  y con una corrección local aún no publicada.

Archivos principales de la Semana 1:

- `apps/api/prisma/schema.prisma`;
- `apps/api/prisma/migrations/20261112000100_consent/migration.sql`;
- `apps/api/src/consent/`;
- `apps/api/src/audit/`;
- `apps/api/src/app.module.ts`;
- `apps/api/test/privacy.test.cjs`;
- `apps/web/src/features/privacy/PrivacyPage.tsx`;
- `apps/web/src/features/privacy/privacy.css`;
- `apps/web/src/features/permissions/RolePermissionsPage.tsx`;
- `apps/web/src/features/auth/navigation.ts`;
- `apps/web/src/main.tsx`;
- `docs/api/openapi.json`;
- `apps/web/src/lib/api/schema.d.ts`.

## Reproducción

Desde el repositorio:

```powershell
Set-Location .\apps\api
npm run build
npm run test:privacy

Set-Location ..\web
npm run build
npm run test:e2e
```

Las pruebas de persistencia deben usar una PostgreSQL local descartable y una
`DATABASE_URL` aislada. No deben ejecutarse contra Supabase ni contra la base
compartida.

## Pull Requests y publicación

La consulta de GitHub no encontró un Pull Request abierto o cerrado hacia
`main` para `privacidad-auditoria` ni para `administracion-usuarios`.
Por esa razón no se incluye un enlace de PR y no se creó uno durante esta
sesión. Tampoco se hizo push, merge ni rebase.

## Pendientes de revisión y aprobación de Roberto

1. Revisar y aprobar los contratos y la implementación de consentimiento y
   auditoría.
2. Confirmar la aplicación coordinada de la migración en el entorno
   compartido; esta entrega solo la validó en PostgreSQL aislada.
3. Revisar la sanitización de detalles y el alcance de los datos visibles en
   la tabla de auditoría.
4. Revisar visualmente P22/P23 y decidir si se requiere un endpoint
   administrativo adicional para listar aceptaciones.
5. Revisar la corrección local de estados de carga en P20 y la accesibilidad
   del detalle de P23.
6. Confirmar en el entorno compartido la migración y el recorrido autenticado
   con cuentas reales; las pruebas actuales son aisladas o con fixtures.
7. Autorizar, si corresponde, el commit/push de los cambios locales y la
   creación posterior del Pull Request.

No se declara iniciada la Semana 2. Exportaciones, anonimización avanzada,
reportes adicionales y cualquier integración con la base compartida quedan
fuera de esta entrega.
