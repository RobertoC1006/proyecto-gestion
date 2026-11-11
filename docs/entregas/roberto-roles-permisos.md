# Matriz editable de roles y permisos

11 de noviembre de 2026. Implementación solicitada por Roberto a partir de su
captura de VEXOR y confirmación de cambiar/guardar permisos reales manteniendo
los cinco roles. Rama roles-permisos desde acceso-navegacion@b54bed3.
Backend y SQL: 9491eab. Sin publicación/integración en main.

## Resultado

- `/admin/permisos` usa el diseño compartido de CampusITSM: verde/menta,
  DM Sans/Manrope, selector de cinco roles, buscador, módulos desplegables,
  matriz de acciones, casillas individuales/agrupadas con estado parcial y panel
  sobre el rol. Responsive con cinco roles visibles y tabla desplazable en móvil.
- Guardar requiere motivo, conserva versión y persiste en PostgreSQL. Datos
  propios/equipo/institución se respetan; permisos ajenos al máximo de cada rol
  están bloqueados. Usuarios y Roles y permisos están protegidos para administrador.
- Acciones dependientes activan su lectura; retirar lectura retira esas acciones.
  Se distinguen las funciones que todavía están pendientes. No hay creación,
  renombrado/borrado de roles ni excepciones por persona.
- GET/PATCH role-permissions comprueban sesión, administrador, permisos efectivos,
  institución, Origin y CSRF. Revalidación del actor, control de versión,
  serialización por institución y auditoría atómica. Las sesiones actuales leen
  permisos vigentes en cada solicitud; el calendario publicado los aplica.
- Menú, dashboard y rutas consumen capacidades actuales. Cambiar permisos limpia
  consultas previas; guardar refresca sesión. Los cambios sin guardar se advierten
  al cambiar rol, navegar fuera o recargar. Fallos no afirman éxito y los conflictos
  permiten actualizar la matriz sin sobrescribir silenciosamente la edición.

## Base compartida

Se comprobó la estructura real antes de crear tablas: sin conflictos, seis
migraciones históricas con checksum igual al código, conexión API/campusitsm/TLS.
La migración aditiva 20261111000100_role_permissions, guardada antes de ejecutar,
se aplicó con el comando manual y credencial migradora privada.

Verificación posterior: siete migraciones coincidentes, ambas tablas con RLS y
RolePermissionChange sin UPDATE/DELETE para la API. Cero RoleAccess y cero
RolePermissionChange al finalizar: ninguna cuenta real cambió sus permisos.
Sin alteraciones de Auth, datos de otros módulos o migraciones aplicadas.
No se crearon usuarios/sesiones ficticios en la aplicación normal.

## Comprobaciones

- Compilaciones API/web, generación Prisma, OpenAPI y tipos aprobados.
- 39 comprobaciones en PostgreSQL descartable aprobadas: sesión/identidad,
  calendario, aislamiento, validación, actor revocado, CSRF/Origin, auditoría,
  permisos con sesiones existentes en dos servidores y ediciones concurrentes.
  Los recursos descartables se cerraron; no queda otra aplicación de revisión.
- 33 pruebas Playwright aprobadas: acceso/dashboard/calendario/login y ocho
  recorridos de matriz, guardado/recarga, dependencia/agrupación, permisos
  protegidos, salida sin guardar, fallo/reintento, conflicto y UI de dos tamaños.
- Las pruebas de escritura de navegador sustituyen respuestas de API; el guardado
  HTTP real con PostgreSQL se prueba exclusivamente en la base aislada. Los
  recorridos sin sesión también verifican el servidor normal, incluido 401 en
  role-permissions. No se usa la contraseña ni se guardan cambios con cuentas reales.
- Capturas de matriz: `.local/verification/roles-permisos/`, con fixture en su
  nombre. Revisión visual de escritorio y móvil completada.

API/web/predictions saludables en la única instalación campusitsm de Roberto.
Los volúmenes y outputs previos se conservan.

## Coordinación pendiente

Código local sin integrar/publicar main. Johan/Jasmine deben recibir esta base
antes de usar configuraciones nuevas: un backend anterior con permisos fijos
no puede interpretarlas. La migración vacía conserva los valores iniciales para
compatibilidad inicial. Las migraciones aplicadas no se revierten al volver de rama.
Jasmine mantiene P20/Usuarios y conecta su administración con la base común;
su auditoría puede consumir RolePermissionChange. No se modificaron ramas ajenas
ni se enviaron mensajes al equipo. Contrato y destino/ejecutor/resultado registrados
en CONTRATO_ROLES_PERMISOS y REGISTRO_CAMBIOS_BD.
