# Permisos configurables por rol — roles-permisos

11 de noviembre de 2026. Roberto solicitó una matriz con casillas inspirada en
su referencia visual de VEXOR y confirmó que debe cambiar y guardar permisos
reales, conservando los cinco roles acordados. Amplía la base común de Roberto
y entrega esta parte de P21 por su solicitud. P20/Usuarios sigue con Jasmine;
no se modifica su rama ni se integra automáticamente en main.

## Fuente y alcance

RoleAccess contiene permisos/versiones por institución y CampusRole. Si no
existe una configuración, se usan los valores iniciales canónicos existentes.
IdentityDirectory.principal resuelve permisos efectivos en cada solicitud.
rolePermissions es solo el valor inicial y máximo de alcances para roles no
administrativos; no debe usarse para autorizar solicitudes autenticadas.

Se conservan 14 permisos y alcances propio/equipo/institución. Alumno y docente
disponen de sus cuatro capacidades personales; agente de sus tres capacidades
académicas/de equipo; supervisor de sus cinco capacidades de equipo. El
administrador puede seleccionar cualquiera de los 14 permisos publicados,
incluidas capacidades personales/de equipo si corresponde. El alcance de equipo
siempre exige equipo asignado. Cada módulo comprueba titular e institución.
users:manage y permissions:manage permanecen obligatorios para administrador.
No hay roles personalizados ni excepciones por persona.

Las dependencias de lectura se validan en servidor; la interfaz las activa o
retira junto con sus acciones. Un permiso de una función pendiente no acredita
implementación de esa función; el catálogo informa su disponibilidad.

## API y persistencia

- GET `/api/v1/role-permissions`: cinco roles, permisos/versiones, máximos,
  permisos protegidos, catálogo con etiquetas/acción/alcance y dependencias.
- PATCH `/api/v1/role-permissions/:role`: `{permissions, expectedVersion, reason}`.
  Versión inicial 0 antes de configurar; el primer cambio crea versión 1.
  Motivo obligatorio entre 5 y 500 caracteres. Sin actor/institución del cliente.
- Ambas rutas requieren administrador activo con permissions:manage. Escrituras
  mantienen Origin exacto y CSRF. Respuestas no-store; 400 validación/alcance,
  401 sin sesión, 403 sin permiso, 409 edición concurrente.

El guardado revalida actor/permisos dentro de una transacción serializada por
institución; actualiza RoleAccess y añade RolePermissionChange con
actor/rol/motivo/antes/después. Guardar lo mismo no añade otro cambio.
La API solo tiene SELECT/INSERT en RolePermissionChange, sin editar ni eliminar
el historial. La protección del último administrador sigue vigente.

## Integración con el equipo

Jasmine asigna un rol a una persona mediante IdentityDirectory.changeAccess;
la matriz modifica lo que ese rol permite a todas sus personas de la institución.
No se duplica login/directorio/catálogo. RolePermissionChange queda disponible
para el módulo de auditoría de Jasmine.

Johan/Jasmine deben actualizar esta base común antes de utilizar permisos
configurables: mismo esquema/migración y principal con permisos efectivos. Un
backend antiguo que use valores fijos no interpreta configuraciones nuevas.
Comprobar principal.permissions y el alcance del objeto. Esta rama actualiza
el calendario publicado y sus servicios internos.

El cliente actualiza sesión/menú al guardar, al recuperar el foco, periódicamente
y tras un 403. El servidor aplica permisos vigentes en cada solicitud, incluso
si el navegador aún muestra opciones anteriores. Al cambiar capacidades se limpian
consultas previas del cliente. No se guardan permisos en localStorage.

## Migración y verificación

20261111000100_role_permissions/migration.sql añade dos tablas, claves por
institución, índice del historial, controles de catálogo/alcance y RLS para el
servidor en el esquema privado. No cambia usuarios ni permisos existentes, ni
crea configuraciones iniciales. Las tablas vacías conservan los valores actuales.

39 comprobaciones PostgreSQL aisladas aprobadas antes de ejecutar remotamente.
Estado de aplicación en REGISTRO_CAMBIOS_BD. Las escrituras de prueba no apuntan
a Supabase; no se cambiaron permisos de cuentas reales para probar.
