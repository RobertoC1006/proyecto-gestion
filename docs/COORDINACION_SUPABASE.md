# Coordinación del equipo y sus agentes — Supabase compartido

Acuerdo de Roberto, 7 de noviembre de 2026. Lectura obligatoria junto al plan de
cada integrante y [ESTADO_EQUIPO.md](ESTADO_EQUIPO.md). El reparto de módulos,
pantallas, stack y semanas se conserva.

## Decisión y estado real

**Destino acordado:** los tres ejecutan React/Vite, NestJS y Python en su única
instalación Docker `campusitsm`, en `http://localhost:8080`, y sus backend se
conectan a **la misma base PostgreSQL de desarrollo en Supabase CampusITSM**.
Usuarios, perfiles, roles, calendario y datos de módulos integrados serán comunes,
respetando permisos. PostgreSQL local queda como opción para pruebas aisladas.

**Transición ejecutada:** estructura y datos de negocio ya están en el esquema
campusitsm; Roberto está conectado. Docker normal ya no inicia db ni migrate y
las sesiones se separan por instalación. PostgreSQL local está detenido con su
volumen conservado. Ver [OPERACION_SUPABASE.md](OPERACION_SUPABASE.md) y
[entrega](entregas/roberto-semana-01-base-compartida.md).

**Pendiente:** publicar/integrar el código con autorización de Roberto y entregar
configuración privada/código a Johan/Jasmine y confirmar aceptación. Sus invitaciones
Developer ya se enviaron en la organización gratuita exclusiva CampusITSM, tras
trasladar solo este proyecto por autorización de Roberto. VEXOR permanece separado.
Ver [COLABORADORES_SUPABASE.md](COLABORADORES_SUPABASE.md), incluida la autorización
de la nueva organización en el conector de cada agente.

Auth alojado sí está implementado en `identidad-supabase`, commit `8b02d6f`,
todavía sin integrar en main al revisar GitHub para esta actualización.
Roberto completó registro, confirmación, login y acceso de administrador reales.
No recrear el proyecto ni otro login. El envío de confirmaciones a correos fuera
del equipo Supabase sigue requiriendo un SMTP propio autorizado.

## Qué comparten y qué conserva cada computadora

| Elemento | Acuerdo |
| --- | --- |
| Supabase Auth | Un mismo proyecto de identidad; credenciales allí, no en nuevas tablas de contraseñas |
| Base de negocio | Una sola base de desarrollo compartida, ya conectada para Roberto |
| Código | Un repositorio y una API modular; una rama por módulo, sin prefijo codex/ |
| Ejecución | Cada integrante reconstruye su propia instalación Docker desde su rama |
| Tablas, columnas e índices remotos | Los cambios aplicados afectan a los tres; una rama Git no aísla la base |
| Pruebas destructivas o descartables | PostgreSQL aislado, nunca la base compartida |
| Archivos y modelos | Los volúmenes Docker siguen siendo locales; mover PostgreSQL no comparte adjuntos, PDFs ni modelos |

Un evento guardado en la base común se ve al consultar/actualizar la pantalla
con permisos; no requiere reconstruir Docker. No se promete actualización
automática en vivo si el módulo no la implementa.

Una tabla o índice creado en Supabase es visible para los colaboradores al
actualizar el panel, sin actualizar código ni reconstruir sus aplicaciones.
Crear esa tabla no crea automáticamente rutas del backend ni pantallas. Solo
quien programe una función que use la tabla nueva necesita recibir/actualizar
el modelo Prisma y el código, generar el cliente y reconstruir la imagen de su
aplicación según su modo de desarrollo. Las funciones existentes no necesitan
reconstruirse por cada tabla nueva ajena. No reinstalar Docker ni borrar volúmenes.
Todos crean tablas dentro de CampusITSM, no una base/proyecto nuevo por módulo.

Compartir datos no significa que un estudiante pueda ver casos ajenos. Mantener
institución, titular, equipo y políticas comunes en NestJS. React consume NestJS;
no se añade un acceso directo paralelo desde React a tablas Supabase.

## Antes de conectar a los compañeros

Roberto coordina esta entrega de transición; los agentes de Johan/Jasmine no la
ejecutan unilateralmente por leer un plan. La entrega registra los siguientes puntos; accesos reales de compañeros aún pendientes:

1. Código base disponible y autorizado para consumir, con rama/commit y contratos.
2. Inventario de esquema/datos a trasladar, respaldo comprobable y conservación
   de los UUID de cuentas/perfiles; no sobrescribir esquemas gestionados por
   Supabase como `auth` o `storage`.
3. Conexión de servidor y arranque adaptados: levantar una rama no debe aplicar
   sus migraciones pendientes automáticamente a la base común. Se separa el paso
   explícito de migración remota del arranque diario.
4. Configuración privada de cada backend, permisos de conexión y procedimiento
   de migración. Las claves publishable no son credenciales PostgreSQL de migración.
5. Tratamiento de las sesiones cifradas entre instalaciones y su alcance; no
   improvisar claves compartidas ni perder sesiones al cambiar de configuración.
6. Colaboradores invitados con acceso revisado para CampusITSM, comprobando el
   alcance sobre otros proyectos de la organización. Rol de colaborador Supabase
   y rol dentro de CampusITSM son permisos distintos.
7. Comprobación con dos instalaciones: mismas cuentas/perfiles autorizados,
   mismo evento consultable y persistencia tras reconstruir una aplicación.
8. Estado de habilitación actualizado en ESTADO_EQUIPO y aviso de Roberto a los
   compañeros con la configuración por un medio privado, sin secretos en los ZIP.

Mientras reciben el código autorizado y su configuración privada pueden avanzar en código, contratos y pruebas locales de la
semana solicitada, manteniendo cerrado lo que dependa de servicios no disponibles.
No inventar identidades, catálogos o servicios para eludir una dependencia.

## Cómo proponer y aplicar cambios de estructura

Los tres escriben el backend y las migraciones de sus módulos. Roberto coordina
su orden, relaciones comunes y aplicación a la base compartida. Prisma y
`apps/api/prisma` siguen siendo la única fuente de esquema/migraciones de negocio;
no crear una segunda historia de las mismas tablas con Supabase CLI o SQL suelto.

**Autonomía aclarada por Roberto:** una vez habilitado el entorno y sus accesos,
Johan/Jasmine y sus agentes pueden crear tablas, columnas e índices nuevos de su
propio módulo, dentro del plan y compatibles con consumidores activos, validarlos
y aplicarlos sin pedir permiso a Roberto por cada cambio. El encargo del módulo
es autorización para esos cambios ordinarios. Registrar y avisar es coordinación,
no una aprobación adicional por tabla. Mantener migraciones en Git y pruebas.

Consultar antes de alterar tablas/contratos de otros módulos, identidad/permisos
comunes o introducir un cambio que rompa consumidores. No se autoriza borrar
tablas/datos existentes ni saltarse los límites del plan por tener acceso de
colaborador. Esta autonomía no inicia por sí sola el traslado o las invitaciones.

1. **Consultar:** antes de crear una tabla/columna/índice, revisar esquema actual,
   migraciones aplicadas, ramas activas y cambios anunciados. Confirmar que no
   existe ya ni está reservada por otro módulo.
2. **Anotar el trabajo:** registrar responsable, rama/commit, archivo de migración, tablas
   afectadas, relaciones, consumidores y finalidad en
   [REGISTRO_CAMBIOS_BD.md](REGISTRO_CAMBIOS_BD.md).
3. **Preparar y validar:** guardar la migración en Git, probarla sobre una base
   aislada y revisar compatibilidad con el código que siguen ejecutando los otros.
   Preferir cambios aditivos compatibles; coordinar renombrados, restricciones
   nuevas y eliminaciones antes de ejecutarlos.
4. **Distinguir el alcance:** para cambios ordinarios del módulo delegado,
   registrar/anunciar el cambio y continuar sin esperar permiso por cada tabla.
   Si afecta a partes compartidas, otros módulos o compatibilidad, coordinarlo
   previamente con sus responsables/Roberto. No repetir una aprobación existente.
5. **Aplicar de uno en uno:** el integrante responsable aplica su migración
   validada dentro del alcance delegado, sobre el proyecto/entorno confirmado. Registrar
   quién la aplicó, versión exacta y resultado. Una sola aplicación por cambio.
6. **Verificar y avisar:** comprobar estructura, datos y consumidores; actualizar
   el registro y los contratos/OpenAPI que correspondan. Cada integrante actualiza
   su rama de forma coordinada y reconstruye cliente Prisma/backend si lo necesita.
7. **Integrar:** entregar el cambio completo a main mediante revisión de Roberto;
   conservar en Git todas las migraciones remotas ya aplicadas. No editarlas ni
   borrarlas para resolver conflictos; la corrección lleva una migración nueva.

Un cambio ordinario delegado puede validarse y aplicarse al entorno de desarrollo
**antes de fusionar el módulo completo**. Un cambio común requiere el acuerdo de
los responsables antes de aplicarlo para desbloquear al equipo.
Debe quedar identificado por archivo y commit y compartirse como dependencia;
no se presenta una rama pendiente como entrega ya integrada en main. Si el cambio
rompe consumidores activos, se acuerda y prepara primero la actualización conjunta.

No ejecutar `migrate reset`, `db push`, `supabase db reset`, borrados masivos,
TRUNCATE o pruebas destructivas en la base común. No hacer cambios manuales en el
panel sin su migración revisada en Git. Si aparece una diferencia no registrada,
inspeccionarla y coordinar su reconciliación; no borrar historial o datos para
silenciarla. Revertir una rama Git no revierte una migración remota.

## Reparto para evitar duplicación

| Responsable | Cambios propios y coordinación |
| --- | --- |
| Roberto | Infraestructura/conexión, esquema común, identidad, roles/permisos, calendario, contratos e integración; coordina la habilitación compartida |
| Johan | Tickets, adjuntos, atención/prioridad y clasificación; consume usuarios/calendario comunes y publica temprano sus contratos para Jasmine |
| Jasmine | Administración sobre AppUser/servicios de Roberto, consentimiento, auditoría y constancias; consume tickets de Johan, no duplica usuarios/login |

Cambiar AppUser, institución, equipo, identificadores canónicos o contratos
consumidos por otros requiere coordinación entre responsables. Cada agente revisa
el trabajo existente y las ramas antes de introducir tablas/servicios paralelos.

## Datos, pruebas y archivos

- Las escrituras de prueba manual en la base compartida afectan a todos. Acordar
  usuarios/cursos/casos de demostración; identificar datos sintéticos y respetar
  datos existentes. No ejecutar semillas masivas o reinicios automáticos al arrancar.
- Las pruebas automatizadas usan credenciales/base descartable explícitas y se
  comprueba el destino antes de escribir. Al terminar no queda otra aplicación de
  revisión encendida. El trabajo diario sigue usando una instalación por equipo.
- No lanzar notificaciones, tareas programadas, entrenamiento o trabajos masivos
  desde cada computadora contra la base común sin coordinar ejecutor e idempotencia.
- Antes de compartir adjuntos o constancias entre computadoras, acordar con Roberto
  el almacenamiento privado común. La base remota por sí sola no comparte archivos.
  No duplicar otra infraestructura de archivos desde un módulo por cuenta propia.
- Credenciales solo en configuración privada del servidor; nunca en React, Git,
  mensajes, planes, capturas o paquetes. No compartir la contraseña personal de
  Roberto ni darle al agente acceso a otros proyectos como efecto secundario.

## Punto de inicio para cualquier agente

Leer AGENTS, memoria del proyecto, plan personal, esta guía, ESTADO_EQUIPO y
contratos. Revisar Git/ramas y el destino real de la base. Distinguir siempre
**acuerdo aprobado**, **código disponible en una rama** y **conexión compartida
habilitada y verificada**. Ejecutar solo el módulo/semana solicitado.
Este documento no invita colaboradores, no traslada datos, no aplica migraciones
ni modifica permisos por sí mismo.
