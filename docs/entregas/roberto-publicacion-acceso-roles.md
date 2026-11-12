# Publicación conjunta de acceso, dashboard y roles/permisos

11 de noviembre de 2026. Roberto autorizó «integremos todos los cambios al main».
Main remoto de partida f4a44572ae3b259af23e9a313209d5845a4c3fe4, verificado con
fetch/ls-remote. Incluye los avances propios preparados y su documentación,
conservando historial. No incorpora ni modifica código pendiente de compañeros.

## Historia integrada

- b54bed3: acceso antes del panel, origen local, menú/rutas por capacidades y
  dashboard privado con nombre real, sin cifras/tickets de ejemplo.
- 9491eab: permisos efectivos por institución/rol, persistencia y auditoría,
  protección de administración, validación/concurrencia y calendario compatible.
- eead97b: matriz editable con casillas, roles, módulos, búsqueda, motivos,
  advertencia de cambios sin guardar y actualización de sesión/menú.
- 810cfe0 y 38c9a1e: revisión favorable de migración de tickets, contrato de
  evidencias, prioridad del primer avance sin adjuntos y herramientas/documentación.
- Estado, memoria del repositorio y planes actualizados con esta publicación;
  paquetes compartibles regenerados y verificados.

La unión entre revisión-incidencias y roles-permisos solo coincide en documentación.
ESTADO_EQUIPO conserva las dos entregas y aclara su situación vigente. El código
de API/web y Compose es idéntico al eead97b ya validado: 39 comprobaciones
PostgreSQL aisladas y 33 de navegador. No se repiten pruebas destructivas ni se
escriben datos de prueba en la base compartida por publicar.

## Estado operativo

La migración 20261111000100_role_permissions ya se aplicó y verificó antes de esta
publicación; no se ejecuta otra vez. Siete migraciones coincidentes, RLS activo,
tablas nuevas sin cambios de permisos reales al cierre de la implementación.
La instalación campusitsm de Roberto continúa saludable con este código.

Johan/Jasmine incorporan origin/main en sus propias ramas sin descartar trabajo
y reconstruyen su instalación habitual. No ejecutar semillas, bootstrap-admin,
reset ni compartir claves propias. El backend anterior de permisos fijos no
interpreta configuraciones nuevas; recibir primero la nueva base común.

P20/Usuarios y auditoría/consentimiento permanecen con Jasmine. La entrega de
tickets de Johan conserva revisión favorable, pero su código y migración no se
integran/aplican por publicar estos cambios. Adjuntos/Storage siguen pospuestos.
No se enviaron mensajes al equipo ni se autorizó despliegue público del sistema.

## Publicación y limpieza

Publicar main con avance normal, sin forzar. Verificar que origin/main y main
coincidan y que todos los commits de origen sean ancestros. Retirar únicamente
acceso-navegacion, roles-permisos y revision-incidencias tras esa comprobación;
solo revision-incidencias tenía rama remota al iniciar. Conservar
administracion-usuarios, gestion-incidencias y front-vistas. El directorio outputs
previo y los volúmenes se conservan. Los ZIP de planes son regenerables y no
incluyen configuración privada, respaldos ni datos de sesión.
