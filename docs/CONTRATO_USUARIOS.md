# Administración básica de usuarios — P20

Integrado en main por autorización expresa de Roberto después de revisar
la pantalla. Preparado en `usuarios-modal-correcciones`, creada directamente
desde `administracion-usuarios@7ab1ed7`; conserva la historia de Jasmine y añade
la corrección `8350650`. Ver [publicación](entregas/roberto-publicacion-usuarios.md).

## Alcance y autorización

P20 administra cuentas canónicas existentes; no crea otro registro, login ni
directorio. Todas las rutas usan `CampusSessionGuard` y `users:manage`.
Las consultas se limitan a la institución de la sesión. No se acepta actor ni
institución del cliente. Un identificador válido de otra institución devuelve
el mismo 404 que uno inexistente; un UUID malformado devuelve 400.

`IdentityDirectory.changeAccess` sigue siendo el único servicio de cambios:
revalida al administrador dentro de su transacción, protege al último
administrador activo, verifica el equipo y exige versión/motivo. El cambio y
`IdentityChange` se guardan atómicamente. La nueva `accessVersion` invalida las
sesiones anteriores del usuario modificado.

## API

Prefijo `/api/v1`; origen de la aplicación `http://localhost:8080`.

| Método y ruta | Contrato |
| --- | --- |
| GET `/users` | Lista paginada de usuarios de la institución |
| GET `/users/teams` | Equipos de soporte de la institución |
| GET `/users/:id` | Perfil con rol, estado, equipo y accessVersion |
| PATCH `/users/:id/access` | `{role, active, teamId, reason, expectedVersion}` |

Consulta del listado: `page` entero 1–100000, predeterminado 1; `pageSize`
entero 1–100, predeterminado 20. Filtros opcionales: `role` de los cinco roles
publicados, `active` booleano, `teamId` UUID y `search` de hasta 100 caracteres.
Para compatibilidad, active admite también 1/0. Las entradas malformadas y
parámetros desconocidos se rechazan con 400 `VALIDATION_ERROR`; no se ignoran
silenciosamente filtros inválidos ni se truncan textos fuera del límite.

La respuesta del listado contiene `{items, total, page, pageSize}`.
El perfil contiene solo los campos publicados en UserItemDto, sin tokens,
credenciales ni datos de sesiones. El equipo puede ser null.

PATCH requiere Origin y X-CSRF-Token. Motivo entre 5 y 500 caracteres, un rol,
un equipo o null y versión actual entera positiva. Errores: 400 validación,
401 sesión ausente/vencida, 403 sin permiso o protección de escritura,
404 usuario no disponible y 409 CONFLICT/LAST_ADMINISTRATOR.

OpenAPI versionado en `docs/api/openapi.json`; tipos generados en
`apps/web/src/lib/api/schema.d.ts`. El cliente de Usuarios utiliza esos tipos
y las etiquetas comunes de roles de la identidad existente.

## Pantalla

`/admin/usuarios` conserva búsqueda, filtros, tabla y paginación. Editar abre
el Modal compartido. Un grupo de tarjetas permite elegir **un solo rol** y
otro **un solo equipo**, incluida la opción Sin equipo. Son controles radio
nativos, con selección y navegación por teclado. No se introduce multirrol.
El acceso activo se controla con un switch y el motivo permanece obligatorio.

El modal protege cambios sin guardar y bloquea cierre/controles durante el
guardado. En conflicto permite recargar el perfil antes de editar de nuevo.
Cerrar devuelve el foco al control de origen. El indicador Cargando perfil
solo aparece al consultar una cuenta seleccionada. El listado usa todo el ancho.

## Validación y operación

- Compilaciones API y web aprobadas.
- 50 comprobaciones del servidor aprobadas en PostgreSQL descartable: las
  existentes de calendario/identidad/permisos y diez escenarios de P20.
- Ocho recorridos de Usuarios aprobados tras el último ajuste del modal,
  con respuestas API sustituidas. Cubren edición/tarjetas/switch, filtros,
  conflicto/recarga, permisos, foco/Escape, cambios sin guardar, solicitud
  pendiente, último administrador y móvil sin desbordamiento.
- Las otras 33 pruebas de navegador de calendario/acceso/identidad/permisos
  pasaron durante la comprobación de regresión. La de dashboard se actualizó
  para reconocer el enlace de Usuarios que ahora está disponible.

Las pruebas de persistencia nunca apuntan a Supabase. Se retiraron los recursos
descartables de campusitsm-users-modal-check al terminar. La instalación habitual
campusitsm usa el mismo código integrado en main, con API/web/Python y los volúmenes
conservados. **Guardar desde la aplicación de trabajo modifica cuentas reales.**

No hay cambios de esquema ni migraciones nuevas. No se modificaron cuentas
reales para comprobar el guardado. Consentimiento, auditoría global, constancias
y reportes conservan sus módulos y no se declaran terminados por esta entrega.
