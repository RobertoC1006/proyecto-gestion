# Estado del equipo — actualización del 12 de noviembre de 2026

## Flujo integrado en main y aviso para los agentes

Roberto autorizó continuar con la integración y publicación del flujo del caso
práctico. Merge `eccd465`, conservando `1e82d84` y la historia de Johan
`1667778`. El código funcional no cambia respecto a la entrega validada; no se
reaplican migraciones ni se reescriben los planes. Este punto actualiza las
referencias anteriores que indicaban integración pendiente.

Comprobación de publicación: API/web recompiladas desde main, cliente Prisma
generado, tres servicios saludables y HTTP 200 en localhost:8080; salud de base
y servicio auxiliar ok. El paquete web servido coincide con la compilación.

Johan y Jasmine deben comprobar el nuevo origin/main e incorporarlo en sus ramas
sin descartar trabajo, con el esquema Prisma compatible, y reconstruir su única
instalación campusitsm. Aviso listo para compartir o pegar a sus agentes:
[CONTINUIDAD_AGENTES_CASO_PRACTICO.md](CONTINUIDAD_AGENTES_CASO_PRACTICO.md).

Se preservan las ramas del equipo. Se detectó `constancias-verificables@f15d204`
con vistas iniciales explícitamente sin backend/PDF/verificación real; no se
integra ni se declara módulo terminado. `privacidad-auditoria` también conserva
su alcance separado. Los apartados siguientes mantienen la evidencia histórica.

## Flujo del caso práctico implementado en rama propia

Encargo de Roberto: tres perfiles visibles (administrador/TI, profesor y
estudiante), programación académica propia, prioridad contextual, cola,
atención/resolución y seguimiento. Rama `flujo-caso-practico`, código `48b78d8`,
desde la revisión de Johan, sin integrar main ni alterar sus ramas.

Servidor y web compilan. 58 pruebas aisladas aprobadas: identidad, permisos,
usuarios, calendario, cuatro puntajes, aislamiento institucional/titular,
profesor limitado a sus asignaciones, reintentos, versiones concurrentes y
resolución con SLA desde el registro. Dos migraciones aplicadas por autorización
específica, diez checksums coincidentes y protección de tablas comprobada.
La instalación habitual está saludable. Registro y contrato del flujo detallan
el alcance. No se afirma medir mejoras porcentuales ni rendimiento de IA.

Escenario cargado mediante la interfaz y sesión real de Roberto: dos cursos,
dos secciones, asociaciones del estudiante, examen y entrega, cuatro tickets
identificados como demostración. Comprobados 12/P1, 9/P1, 6/P2 y 2/P4 en la
base compartida y la cola. En pantalla: orden técnico T2→T1 y contextual T1→T2.
T1 pasó de registrada a en_atencion y resuelto, con primera respuesta, solución
explícitamente simulada e historial; sus plazos originales se conservaron.
Calendario administrativo muestra ambos eventos y su detalle. No se presenta
la resolución de demostración como reparación real de Moodle. Con sesión real
estudiante se comprobaron dashboard, las dos actividades en calendario, enlace
a nuevo reporte con curso/sección y contexto precargados, listado de cuatro
incidencias y seguimiento de T1 resuelta con la misma solución e historial.
Se reinició la API sin perder sesión, datos ni estado. La pestaña del seguimiento
de T1 queda abierta para revisión. Son comprobaciones manuales con API real;
no se declara ejecutada toda la suite de navegador. Las pruebas de interfaz
afectadas se adaptaron a los tres perfiles y a los controles actuales.
Detalle: [entrega del flujo](entregas/roberto-flujo-caso-practico.md).
Roberto aplaza la prueba del profesor con una cuenta real; no se crean cuentas
ni se cambian roles del equipo para simularla. Constancias, IA, pronósticos,
adjuntos y consentimiento/auditoría global conservan su alcance pospuesto.

## Revisión en pantalla de incidencias — 12 de noviembre de 2026

Johan publicó `gestion-incidencias@1667778`, que incorpora main `4855a10` y
conecta P03 con cursos/secciones propios. Roberto pidió ver esta versión y
autorizó expresamente aplicar su migración ya revisada. Se aplicó y verificó
`20261108000100_tickets_core` en la base compartida: ocho migraciones y checksums
coincidentes, RLS y privilegios de las dos tablas comprobados. Ver
[REGISTRO_CAMBIOS_BD.md](REGISTRO_CAMBIOS_BD.md).

La rama local de revisión `revision-incidencias-pantalla` conserva el código
de Johan. API/web compilan, cinco pruebas de servicio sin red pasan, y la única
instalación campusitsm está saludable en localhost:8080 con sus volúmenes.
Roberto inició sesión personalmente con la cuenta estudiante y se abrió P03
con servicios reales y selector General/Curso. Se mostró el alcance Curso;
no se enviaron reportes. Creación, persistencia y aislamiento HTTP entre dos
cuentas siguen pendientes de comprobar. No se crearon tickets ni se cambiaron
roles o permisos para esta revisión. Main no se fusionó;
consentimiento/auditoría global y adjuntos siguen pospuestos por la priorización
de Roberto conservada en `alcance-primer-avance@bb8df0a`. Esta sección actualiza
los estados anteriores que indicaban `90a2790` o migración pendiente.

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

## Avance de Johan — Semana 1 de incidencias — 12 de noviembre de 2026

En `gestion-incidencias` se conectó P03 al contrato ya integrado de cursos
propios (`GET /academic/me/courses` y `GET /academic/me/sections?courseId=...`).
El cliente conserva `allPages` y los tipos de `lib/api/academic`; General no
consulta cursos y envía `scope: general` con curso/sección nulos. Curso exige un
curso asociado a la sesión, permite sección opcional y limpia la selección al
cambiar de curso. Estados vacíos y errores de consulta se muestran por separado,
con reintento y preservación del formulario. El servidor sigue derivando titular
e institución de la sesión y valida la asociación al crear el reporte.

P02–P05 mantienen el recorrido existente de tickets: creación con código y
estado inicial `registrado`/clasificación `pendiente`, listado y detalle del
titular, paginación/búsqueda y misma respuesta 404 para tickets ajenos o
inexistentes. Se mantiene la clave de idempotencia al reintentar la misma
solicitud. Se añadieron casos Playwright para los alcances General y Curso y para
limpiar la sección al cambiar de curso.

Verificación de código disponible en esta sesión: compilación de API, generación
de OpenAPI y tipos web, `tsc --noEmit` del frontend y cinco pruebas unitarias de
tickets aprobaron. `git diff --check` pasó. Los recorridos Playwright, los
alcances con base local, el 404 HTTP entre dos cuentas y persistencia tras
reinicio quedan pendientes de ejecución en Compose local. La última salida
compartida por Johan mostraba API reiniciándose, mientras PostgreSQL y Python
estaban saludables; el contenedor `migrate` reflejaba una ejecución de cinco
días antes. La migración de permisos `20261111000100_role_permissions` es
posterior, por lo que debe aplicarse y verificarse primero en PostgreSQL local.
No usar esta indicación para apuntar a Supabase.

La revisión técnica previa de Roberto para la migración inicial de tickets está
registrada en [REVISION_MIGRACION_TICKETS.md](REVISION_MIGRACION_TICKETS.md),
incluidas 35 comprobaciones PostgreSQL descartables. En esta sesión no se pudo
repetirlas porque el entorno de ejecución no tenía Docker disponible. No se
modificó ni aplicó la migración de tickets a la base compartida.

El contrato de evidencias ya está publicado, pero el bucket privado compartido
y su configuración de servidor siguen sin habilitarse: carga/descarga no forman
parte de este avance. `ticket.created` continúa como futura integración de
Jasmine y no bloquea la creación ni introduce auditoría paralela. Detalle:
[entrega de Johan, Corte 4](entregas/johan-semana-01-corte-04.md).
