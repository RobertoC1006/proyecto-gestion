# Estado del equipo — 11 de noviembre de 2026

## P20 integrado por autorización de Roberto

Por solicitud de Roberto, rama creada directamente desde la entrega de Jasmine
`administracion-usuarios@7ab1ed7`. Se conserva su historia y su rama remota.
Listado a ancho completo y edición en el Modal compartido: tarjetas para un rol
y un equipo, switch activo/inactivo, motivo y protección de cambios sin guardar.
Se corrigen UUID/paginación/filtros inválidos y se publican OpenAPI/tipos en esta
rama. No hay nuevas tablas ni migraciones. P20 figura disponible en el catálogo.

Compilaciones aprobadas; 50 comprobaciones PostgreSQL aisladas y ocho recorridos
de Usuarios aprobados, más las 33 comprobaciones de pantallas comunes realizadas
durante la regresión. Roberto revisó y autorizó integrar esta versión en main, conservando la historia
de Jasmine y la corrección `8350650`. La única instalación campusitsm conserva
este código verificado en localhost:8080, con sus volúmenes y base compartida.
No se modificaron cuentas reales para probar guardado. Las ramas remotas de los
compañeros se conservan: Jasmine continúa consentimiento/auditoría y Johan su
núcleo de tickets. No se integra su rama de incidencias en esta publicación.
Detalle: [publicación de Usuarios](entregas/roberto-publicacion-usuarios.md).
Los compañeros incorporan el nuevo main antes de continuar, sin descartar su
trabajo. Alcance y operación: [CONTRATO_USUARIOS.md](CONTRATO_USUARIOS.md).

## Publicación conjunta autorizada en main — 11 de noviembre

Roberto autorizó integrar todos los avances propios preparados. Main incorpora
acceso/dashboard `b54bed3`, servidor y migración de permisos `9491eab`, matriz
`eead97b` y la revisión/documentación `810cfe0`/`38c9a1e`. Se conservan las dos
líneas de historia; la coincidencia documental se resuelve conservando ambas.
El código de API/web es el mismo que aprobó 39 comprobaciones PostgreSQL y 33
de navegador. La integración no vuelve a aplicar migraciones ni cambia cuentas.

Johan/Jasmine deben incorporar este main en sus propias ramas y reconstruir su
instalación para consumir permisos efectivos. Sus ramas gestion-incidencias y
administracion-usuarios conservan su trabajo sin integrar en esta publicación.
P20/Usuarios sigue con Jasmine; el núcleo de tickets de Johan continúa pendiente.
Adjuntos y Storage siguen pospuestos para el primer avance. Se regeneran los
paquetes y se retiran solo las ramas propias después de verificar su integración
y publicación. Detalle: [entrega de publicación](entregas/roberto-publicacion-acceso-roles.md).

## Roles y permisos con casillas — roles-permisos

Roberto pidió una matriz similar a su referencia de VEXOR y confirmó que debe
guardar permisos reales por rol, conservando los cinco roles acordados. Esta
rama parte del dashboard/acceso local `b54bed3`; backend/migración en `9491eab`.
Pantalla `/admin/permisos`, accesible desde Permisos y el dashboard para
administrador. Selector de roles, módulos desplegables, casillas individuales y
agrupadas, búsqueda, motivo, protección de cambios sin guardar y conflictos.

RoleAccess es la nueva fuente por institución/rol sobre los valores iniciales.
RolePermissionChange guarda actor/motivo/antes/después de forma atómica. La
sesión resuelve permisos efectivos en cada solicitud; el calendario deja de
autorizar por una lista fija del rol. Usuarios/P20 sigue con Jasmine y su cambio
de rol usa IdentityDirectory.changeAccess. Esta entrega concreta la matriz P21
por solicitud de Roberto; no integra ni modifica la rama de Jasmine.

Migración 20261111000100_role_permissions aplicada y verificada en la base
compartida, tablas nuevas vacías, siete checksums coincidentes y RLS activo.
No se cambiaron permisos de cuentas reales. 39 comprobaciones PostgreSQL
aisladas y 33 de navegador aprobadas, con revisión visual escritorio/móvil.
Instalación campusitsm saludable. Código integrado en la publicación conjunta
autorizada arriba; compartir la nueva base con Johan/Jasmine antes de utilizar configuraciones
distintas, porque sus backends anteriores no las interpretan. Contrato:
[CONTRATO_ROLES_PERMISOS.md](CONTRATO_ROLES_PERMISOS.md). Registro:
[REGISTRO_CAMBIOS_BD.md](REGISTRO_CAMBIOS_BD.md). Ver
[entrega](entregas/roberto-roles-permisos.md).

## Corrección local de acceso y navegación — acceso-navegacion

Por el problema reportado por Roberto, se preparó desde main `f4a4457` una
corrección de P01 y del layout compartido. Sin sesión, la entrada y las rutas
privadas llevan a `/login` antes de montar el panel. Menú y pantallas usan los
permisos efectivos enviados por la API; el alumno no ve administración ni TI.
La entrada `127.0.0.1` redirige a `localhost`, conservando puerto/ruta/parámetros,
para respetar APP_ORIGIN sin relajar la comprobación de origen del servidor.

Por indicación posterior de Roberto se recuperó el dashboard privado como
destino tras el login y en `/`. Muestra el nombre de la sesión y los accesos
del rol, sin contadores ni tickets de ejemplo. Comparte el catálogo de navegación
filtrado con Sidebar; las secciones pendientes mantienen su estado no disponible.
Usuarios/P20 y Permisos/P21 conservan su responsable Jasmine; este paso no los
implementa ni integra su rama.

La interfaz está reconstruida y activa en la única instalación `campusitsm`
de Roberto. Compilación y 25 pruebas de navegador aprobadas; la entrada sin
sesión también se comprobó contra la API real. Los roles se comprobaron con
respuestas de prueba del navegador, sin cambiar cuentas de la base compartida.
Sin migraciones ni integración/publicación en main. Jasmine/Johan deben conservar
estos controles al conectar sus pantallas. Ver
[entrega](entregas/roberto-acceso-navegacion.md).

## Prioridad vigente — primer avance sin adjuntos

Roberto pospone evidencias y Storage para concentrar la presentación en acceso,
registro/consulta de incidencias, calendario manual y administración básica
validada. Ver [PRIMER_AVANCE.md](PRIMER_AVANCE.md). Esta decisión actualiza la
prioridad de la revisión conservada debajo: **el bucket y la carga de archivos
no son una dependencia para avanzar el núcleo de tickets ni otros módulos.**

Siguiente trabajo de coordinación de Roberto: preparar la utilización conjunta
del núcleo de tickets y revisar la entrega de administración; Johan conecta sus
cursos y prueba registro/listado/detalle sin adjuntos. No se ha aplicado una
migración, integrado ramas ni completado el avance por actualizar este plan.

## Revisión de tickets y contrato de evidencias — rama revision-incidencias

Roberto solicitó revisar la migración de Johan y definir evidencias. Trabajo
preparado en `revision-incidencias`, desde main `f4a4457`, integrado como
documentación en esta publicación. La migración de tickets no se aplicó remotamente. Dictamen:
[REVISION_MIGRACION_TICKETS.md](REVISION_MIGRACION_TICKETS.md).
Contrato para Johan: [CONTRATO_EVIDENCIAS.md](CONTRATO_EVIDENCIAS.md).

- Revisión favorable del núcleo y metadatos en `gestion-incidencias@90a2790`:
  35 comprobaciones SQL en PostgreSQL aislado y Prisma válido. Se mantienen los
  once servicios existentes y el código INC-año UTC-24 dígitos hexadecimales.
- Consulta remota de solo lectura: seis migraciones con checksums iguales al
  código, doce tablas de negocio; Ticket/TicketAttachment todavía ausentes.
  Rol API, esquema y SSL verificados. No se aplicó migración ni se escribieron
  datos de prueba en la base compartida.
- Antes de habilitar carga, Johan debe añadir en otra migración el máximo de
  5242880 bytes. El SQL inicial solo limita el tamaño a valores positivos.
- Contrato definido: un archivo opcional PNG/JPEG/PDF, hasta 5 MiB; JSON/Base64
  con protección actual, descarga autorizada por NestJS y PUT idempotente.
  Supabase Storage privado común es la recomendación concreta; no se creó
  el bucket ni se entregó una credencial de servidor. Falta su habilitación.
- Las ramas de compañeros no se modificaron. Consentimiento/auditoría conservan
  su responsable; esta revisión no implementa sus módulos ni inicia semana 2.

## Consulta de cursos propios — punto 1 integrado en main

Roberto autorizó implementar únicamente este punto y después publicar e integrar
su entrega en main el 11 de noviembre. Implementación `498d410`, desde main
`69a6907fb0b8ecf5fd5148e584aabb37c05b8895`, integrada conservando su historia.
Se añadieron GET `/academic/me/courses` y
`/academic/me/sections?courseId=…`, con identidad de sesión, paginación y filtrado
por asociaciones propias e institución. No hay tablas ni migraciones nuevas.

Contrato para Johan: [CONTRATO_CURSOS_PROPIOS.md](CONTRATO_CURSOS_PROPIOS.md).
Le corresponde conectar el selector de su formulario y conservar General sin
curso. La revisión de migración y el contrato de adjuntos están preparados en
la rama indicada arriba; la implementación de archivos y aplicación remota siguen pendientes;
consentimiento/auditoría global mantienen su responsable. Este punto no cierra
la semana 1 del equipo ni inicia CSV/SLA/predicción.

Verificación: 29 pruebas de identidad/calendario aprobadas en PostgreSQL
descartable, compilación API y tipos web aprobados. Detalle y estado de revisión
local en [la entrega](entregas/roberto-semana-01-cursos-propios.md).

Ramas de compañeros comprobadas en GitHub antes de publicar el 11 de noviembre:
Johan `gestion-incidencias@90a2790`, Jasmine `administracion-usuarios@a5a8059`.
Jasmine tiene avances posteriores a la revisión inicial de cursos propios;
esta publicación no los integra ni modifica sus ramas. Sus entregas no están
integradas en main. El estado de infraestructura y accesos del 7 de noviembre se conserva
debajo; no acredita por sí solo aceptaciones posteriores.

## Base de negocio trasladada y conectada para Roberto

Supabase CampusITSM, organización exclusiva CampusITSM (exhurkcxcrjlskvldchp),
esquema privado campusitsm; proyecto npjibnlxepiwfermtcmo conservado tras traslado.
Se aplicaron las seis migraciones Prisma, se copiaron las 12 tablas con verificación
de conteos/contenido, conservando UUID, permisos y sesiones de Roberto. Auth/storage
no se sobrescribieron. Base local detenida y volumen conservado; respaldos privados
restaurados correctamente en PostgreSQL descartable.

Docker normal inicia web/api/predictions en localhost:8080. Migrar es un comando
manual, con credencial separada. La API no puede crear tablas ni escribir el
historial; comprueba las migraciones requeridas al iniciar. Sesiones y PKCE tienen
ámbito por instalación y claves propias. No compartir claves de cifrado.

[Operación](OPERACION_SUPABASE.md), [coordinación](COORDINACION_SUPABASE.md),
[registro BD](REGISTRO_CAMBIOS_BD.md) y
[entrega](entregas/roberto-semana-01-base-compartida.md).

## Código en main y accesos pendientes

Roberto autorizó publicar en main el 7 de noviembre de 2026. Se integraron
identidad 8b02d6f, coordinación 1b84ba8/13c6cc7, transición 864413a y entrega
de colaboradores 478ea0f, partiendo de origin/main 02d10f5. Comprobar el SHA
actual al sincronizar. Las ramas propias se retiran solo tras verificar la
integración completa; front-vistas se conserva. Ver
[entrega de publicación](entregas/roberto-publicacion-identidad-supabase.md).

Johan/Jasmine: invitaciones Developer enviadas en la organización gratuita
exclusiva CampusITSM; Roberto sigue Owner. Roberto informó que una invitación fue aceptada; falta
identificar/verificar el resto y entregar configuración privada. El código común
ya se obtiene de main. VEXOR permanece en RobertoC1006. El conector de este chat
aún necesita autorizar CampusITSM; panel y aplicación funcionan. Ver
[COLABORADORES_SUPABASE.md](COLABORADORES_SUPABASE.md).

SMTP para confirmaciones fuera del equipo Supabase pendiente; no desactivar
confirmación ni crear cuentas ficticias. Consentimiento/auditoría global y P20/P21
siguen a cargo de Jasmine sobre la identidad común.

## Reparto y autonomía vigentes

| Persona | Trabajo y dependencias |
| --- | --- |
| Roberto | P01/identidad/permisos comunes, infraestructura, calendario/configuración, predicción y notificaciones. Identidad/transición publicadas en main; acompañar conexión de compañeros y contratos pendientes |
| Johan | P02–P08, incidencias/prioridad/atención/clasificación y evolución de componentes. Reutilizar identidad y calendario |
| Jasmine | P09–P12/P15/P20–P23, administración con servicios comunes, consentimiento/auditoría, constancias/privacidad/reportes |

Cada integrante hace frontend/backend/pruebas de su módulo. Con sus accesos,
puede crear tablas/columnas/índices compatibles nuevos dentro del plan sin permiso
por cambio: validar, migración en Git, registro y aviso. Consultar antes partes
comunes, otros módulos o incompatibilidades. No borrar tablas/datos ni duplicar
login/catálogos. Git separa código; la base compartida recibe cambios inmediatamente.
Ver datos/tablas no requiere reconstruir Docker; consumir nuevas funciones sí
puede requerir actualizar código/modelo y reconstruir esa aplicación.

## Funcional y pruebas

- Roberto comprobó registro/confirmación/login y autorizó su primer administrador.
  Tras el traslado, se verificaron su sesión real, el evento conservado y Crear evento.
- 22 pruebas PostgreSQL de identidad/calendario/proveedor pasaron, incluido el control de conexiones y la de
  dos instalaciones con claves distintas: mismo usuario y evento, sin usar/borrar
  sesiones o flujos PKCE ajenos. Proveedor sustituido exclusivamente en pruebas.
- Respaldo inicial y final restaurados en PostgreSQL 17 descartable; contenido de
  las 12 tablas comparado dentro de la transacción de importación.
- Base visual/calendario en main mediante PR #1/#2; DM Sans/Manrope y Phosphor
  portados de casos-gestion, según DISENO_COMPONENTES.md.
- /academic/me/events existe; contexto/factor/SLA, CSV, tickets, PDF, IA y pronóstico
  siguen pendientes. No se inició otra semana ni se eligió proveedor de IA.

Una instalación de trabajo campusitsm en 8080; conservar volúmenes. Las pruebas
se aíslan y cierran sus contenedores. Los archivos/modelos siguen siendo locales.
Los ZIP son documentación regenerable, sin secretos, y no sustituyen el código
ni acreditan integración. Revisar Git, contratos y el plan propio antes de avanzar.
