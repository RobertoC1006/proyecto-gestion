# Identidad, Supabase Auth y autorización — rama identidad-supabase

**Actualización del 11 de noviembre de 2026:** Roberto solicitó permisos
configurables por rol con guardado real. RoleAccess amplía esta fuente común;
IdentityDirectory resuelve los permisos guardados en cada solicitud, conservando
valores iniciales cuando no hay configuración. Se mantiene el contrato del
principal y los cinco roles. La pantalla y el servicio común de esta parte P21
se entregaron en roles-permisos; P20/Usuarios sigue con Jasmine. Leer
[CONTRATO_ROLES_PERMISOS.md](CONTRATO_ROLES_PERMISOS.md) antes de consumir la
autorización. Cambiar una matriz no obliga a cerrar sesión: los permisos
efectivos se comprueban de nuevo en la siguiente solicitud. Los cambios
individuales de rol/estado/equipo conservan accessVersion y su revocación.

Decisión expresa de Roberto, 6 de noviembre de 2026: Roberto asume login,
autenticación con Supabase Auth y la base común de roles/permisos. P01 pasa a
Roberto. Jasmine conserva P20/P21, consentimiento, auditoría, constancias y
reportes, consumiendo la identidad y autorización comunes.

**7 de noviembre de 2026: identidad y transición Supabase integradas en main por autorización de Roberto.**
Proyecto alojado CampusITSM creado por solicitud de Roberto en su organización,
plan gratuito. Roberto completó registro, confirmación de correo y login reales.
También autorizó asignar su cuenta como primer administrador, conservado al trasladar la base a Supabase.
Pruebas automáticas y límites de aceptación en la entrega de identidad.
La administración P20/P21 y el consentimiento/auditoría global siguen a cargo de Jasmine.

## Límites de cada módulo

| Responsable | Entrega |
| --- | --- |
| Roberto | Supabase Auth, P01, login/logout, sesión/renovación, usuario actual, directorio canónico, cinco roles, permisos/alcances y guardias comunes de NestJS |
| Jasmine | Administración P20/P21 y sus servicios de aplicación, perfiles/estado/equipo y consentimiento/auditoría; cambios sensibles de identidad o rol mediante servicios comunes de Roberto |
| Johan | Autorización de tickets/adjuntos usando el usuario y las políticas comunes; sin otro login, almacén de contraseñas ni motor de roles |

Supabase Auth gestiona credenciales e identidad. Negocio/perfiles/roles están en
el esquema privado campusitsm del mismo proyecto; Roberto ya está conectado.
La rama base-compartida-supabase separa arranque/migración y sesiones por instalación.
Accesos y configuración privada de Johan/Jasmine siguen pendientes. Ver [COORDINACION_SUPABASE.md](COORDINACION_SUPABASE.md).
Modalidad elegida: servicio alojado; Roberto pidió que cada persona pueda registrarse.
Registro con contraseña y confirmación por enlace; recuperación también por enlace.
Los accesos y la validación/renovación de sesiones dependen del servicio externo.
El correo incluido solo admite miembros de la organización Supabase. Abrir el
registro a otras direcciones requiere configurar SMTP propio; no se contrató uno.
Consultar [la guía de desarrollo](AUTH_DESARROLLO.md).

## Decisiones implementadas

- Mantener la regla de no guardar credenciales/tokens ni datos de negocio en
  localStorage. NestJS media el acceso y el navegador usa una sesión opaca HttpOnly
  con Origin y CSRF. Tokens del proveedor y verificadores PKCE solo en servidor,
  cifrados con AES-256-GCM al persistir. No se usa supabase-js en React.
- Validar la identidad con el SDK/servidor o verificación JWT mantenida, según
  las claves del proyecto; comprobar firma, emisor, audiencia, vencimiento y
  estado de acceso. No confiar en un JWT solamente decodificado.
- El `role` técnico de un token Supabase no equivale a los cinco roles de CampusITSM.
  La asignación autorizada, institución, equipo, estado y permisos se resuelven
  en una única fuente del servidor. `user_metadata` editable por el usuario no
  concede privilegios. Los cambios de rol/desactivación deben afectar el acceso
  efectivo, sin depender únicamente de datos viejos del navegador o del token.
- Claves secretas/administrativas solo en servidor y configuración privada, nunca
  en React, repositorio, planes, paquetes de compañeros ni registros de errores.
- UUID canónico de AppUser = subject de Supabase. El primer login confirmado
  crea el perfil compartido como estudiante; nunca toma rol/institución/equipo del cliente.
  Los perfiles existentes conservan estado y asignaciones. La base común conserva UUID, perfiles y roles para los tres. Las sesiones
  llevan instanceId, derivado de la clave propia; una instalación no usa flujos
  ni sesiones de otra. Cambios de acceso invalidan globalmente cuando corresponde.
- Login/logout, protección de escrituras, renovación simultánea y revocación de
  sesión deben probarse explícitamente. No dar por revocado un JWT vigente solo
  por borrar datos del navegador. No seleccionar un plan de pago ni enviar correo
  o habilitar registro público por defecto.

## Contratos publicados en esta rama

Todas bajo `/api/v1/auth`: GET `status`, POST `register`, POST `login`, GET `me`,
POST `logout`, POST `recovery/request`, GET `callback`, GET `recovery/status` y
POST `recovery/reset`. DTO/OpenAPI y tipos del navegador generados desde NestJS.
`me`/`login` devuelven `{user:{id,institutionId,email,displayName,role,teamId,active,permissions},csrfToken}`.
La cookie de sesión es HttpOnly, SameSite=Lax, Path=/; Secure y prefijo __Host-
cuando APP_ORIGIN usa HTTPS. Vida local absoluta: ocho horas. Respuestas no-store.
Los formularios públicos requieren Origin exacto y JSON; las escrituras con sesión
requieren además X-CSRF-Token obtenido de `me`, sin guardarlo en localStorage.

`CampusSessionGuard`, `RequirePermissions`, `requirePermission` y `requireScope`
son la base reutilizable de Johan/Jasmine. El permiso no sustituye la comprobación
del objeto por institución, titular o equipo. Las capacidades de tickets/reportes/
constancias se reservan para sus módulos; no acreditan endpoints ya implementados.
`IdentityDirectory.changeAccess(actorId,subjectId,input)` es el único servicio
de cambios de rol/estado/equipo: actor validado por el servidor, motivo y versión,
sin cambiar institución ni eliminar al último administrador. Los cambios incrementan
accessVersion y guardan IdentityChange en la misma transacción; las sesiones antiguas
dejan de autorizar la siguiente solicitud. Jasmine crea su administración sobre él.

El calendario conecta sus dos puertos a esta base:

- `AcademicIdentity.resolve(request)` devuelve
  `{id,institutionId,role,csrfVerified}` desde la sesión validada del servidor.
- `AcademicDirectory.belongsToInstitution(subjectId,institutionId)` comprueba un
  usuario real autorizado de esa institución; no lo deduce de campos del cliente.

`SessionAcademicIdentity` resuelve sesión validada; `CanonicalAcademicDirectory`
comprueba perfiles locales activos de la misma institución. Sin sesión se mantiene
401; rol no autorizado o CSRF incorrecto devuelve 403. No existe acceso ficticio.
`/calendario` consulta los eventos personales; P17/P18 siguen siendo administración.

Jasmine debe entregar el contrato de consentimiento y de auditoría e integrar
`AcademicChange` e `IdentityChange`, conservando
actor/motivo/antes/después en la misma transacción o mediante entrega persistente.
Johan consume contexto académico; `/academic/me/events` y el servicio interno ya
existen, pero el cálculo del factor y la configuración SLA son de semana 2.
No presentar `/academic/context` como ruta funcional: sigue siendo una propuesta.

## Fuentes técnicas verificadas y referencias

Documentación de Supabase consultada para esta entrega:
[JWT y validación](https://supabase.com/docs/guides/auth/jwts),
[sesiones](https://supabase.com/docs/guides/auth/sessions),
[metadatos de usuarios](https://supabase.com/docs/guides/auth/users),
[claves](https://supabase.com/docs/guides/getting-started/api-keys) y
[desarrollo local](https://supabase.com/docs/guides/local-development).
Registro y recuperación usan PKCE de servidor con las plantillas estándar de enlaces;
no se desactivó la confirmación de correo ni se configuró SMTP de pago.
Una caída al cerrar sesión invalida la sesión local e informa si no pudo confirmarse
la revocación remota; no promete revocar inmediatamente un JWT externo vigente.
