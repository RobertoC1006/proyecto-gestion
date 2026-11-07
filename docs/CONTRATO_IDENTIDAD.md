# Identidad, Supabase Auth y autorización — siguiente módulo de Roberto

Decisión expresa de Roberto, 6 de noviembre de 2026: Roberto asume login,
autenticación con Supabase Auth y la base común de roles/permisos. P01 pasa a
Roberto. Jasmine conserva P20/P21, consentimiento, auditoría, constancias y
reportes, consumiendo la identidad y autorización comunes.

**Estado: diseño de integración, todavía no implementado.** Esta entrega no crea
un proyecto Supabase, no incorpora claves ni habilita sesiones. La publicación
del calendario y de la base visual no significa que el login esté listo.

## Límites de cada módulo

| Responsable | Entrega |
| --- | --- |
| Roberto | Supabase Auth, P01, login/logout, sesión/renovación, usuario actual, directorio canónico, cinco roles, permisos/alcances y guardias comunes de NestJS |
| Jasmine | Administración P20/P21 y sus servicios de aplicación, perfiles/estado/equipo y consentimiento/auditoría; cambios sensibles de identidad o rol mediante servicios comunes de Roberto |
| Johan | Autorización de tickets/adjuntos usando el usuario y las políticas comunes; sin otro login, almacén de contraseñas ni motor de roles |

Supabase Auth gestionará credenciales e identidad. Los datos de negocio siguen
en PostgreSQL/Prisma de Docker. No se ha aprobado migrar toda la base a Supabase.
Antes de implementar, Roberto debe fijar proyecto y modalidad (servicio alojado
o desarrollo local), configuración de acceso y creación/recuperación de cuentas.
Si se elige servicio alojado, los nuevos ingresos y la renovación dependerán de
ese servicio; no afirmar funcionamiento completamente desconectado.

## Decisiones que el módulo debe concretar

- Mantener la regla de no guardar credenciales/tokens ni datos de negocio en
  localStorage. La propuesta es que NestJS medie el acceso al proveedor y que el
  navegador use una sesión opaca HttpOnly con CSRF; los tokens del proveedor se
  administran solo en el servidor, cifrados si se persisten. Este flujo requiere
  implementación explícita: no es el comportamiento por defecto de supabase-js
  en el navegador ni una promesa de que bastará cambiar una opción del SDK.
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
- Definir el UUID canónico del usuario y su relación con el sujeto de Supabase
  antes de crear migraciones de perfiles/asociaciones. No duplicar identidades.
- Login/logout, protección de escrituras, renovación simultánea y revocación de
  sesión deben probarse explícitamente. No dar por revocado un JWT vigente solo
  por borrar datos del navegador. No seleccionar un plan de pago ni enviar correo
  o habilitar registro público por defecto.

## Contratos por publicar antes de conectar consumidores

Rutas propuestas: `/api/v1/auth/login`, `/auth/logout` y `/auth/me` bajo el mismo
prefijo `/api/v1`. La respuesta de usuario actual debe permitir conocer UUID,
institución, rol, permisos, equipo/alcance y estado, sin claves ni tokens privados.
Roberto debe versionar DTO/OpenAPI y el mecanismo de protección de escrituras.

El calendario ya ofrece dos puertos que Roberto debe implementar contra esta base:

- `AcademicIdentity.resolve(request)` devuelve
  `{id,institutionId,role,csrfVerified}` desde la sesión validada del servidor.
- `AcademicDirectory.belongsToInstitution(subjectId,institutionId)` comprueba un
  usuario real autorizado de esa institución; no lo deduce de campos del cliente.

Se deben ajustar esas interfaces de forma coordinada si el contrato final necesita
más permisos. Por ahora deniegan acceso: 401 sin identidad y directorio no disponible.
No crear un adaptador de administrador ficticio para que las pantallas guarden.

Jasmine entrega el contrato de auditoría e integra `AcademicChange`, conservando
actor/motivo/antes/después en la misma transacción o mediante entrega persistente.
Johan consume contexto académico; `/academic/me/events` y el servicio interno ya
existen, pero el cálculo del factor y la configuración SLA son de semana 2.
No presentar `/academic/context` como ruta funcional: sigue siendo una propuesta.

## Fuentes técnicas a revisar al implementar

La integración deberá comprobar nuevamente la documentación vigente de Supabase:
[JWT y validación](https://supabase.com/docs/guides/auth/jwts),
[sesiones](https://supabase.com/docs/guides/auth/sessions),
[metadatos de usuarios](https://supabase.com/docs/guides/auth/users),
[claves](https://supabase.com/docs/guides/getting-started/api-keys) y
[desarrollo local](https://supabase.com/docs/guides/local-development).
Las elecciones de arquitectura anteriores son propuestas del proyecto;
no equivalen a una integración probada ni a configuración ya contratada.
