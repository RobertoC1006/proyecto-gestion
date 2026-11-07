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

**Todavía pendiente:** traslado de estructura/datos de negocio, adaptación de
conexión y arranque, configuración de colaboradores y habilitación para los tres.
El código actual todavía conecta la base de negocio a PostgreSQL en Docker y
ejecuta migraciones al arrancar. No basta con cambiar una URL en un `.env`.
Esta actualización de planes no realiza esas acciones ni autoriza ejecutarlas.

Auth alojado sí está implementado en `identidad-supabase`, commit `8b02d6f`,
todavía sin integrar en main al revisar GitHub para esta actualización.
Roberto completó registro, confirmación, login y acceso de administrador reales.
No recrear el proyecto ni otro login. El envío de confirmaciones a correos fuera
del equipo Supabase sigue requiriendo un SMTP propio autorizado.

## Qué comparten y qué conserva cada computadora

| Elemento | Acuerdo |
| --- | --- |
| Supabase Auth | Un mismo proyecto de identidad; credenciales allí, no en nuevas tablas de contraseñas |
| Base de negocio | Una sola base de desarrollo compartida después de habilitar la transición |
| Código | Un repositorio y una API modular; una rama por módulo, sin prefijo codex/ |
| Ejecución | Cada integrante reconstruye su propia instalación Docker desde su rama |
| Tablas, columnas e índices remotos | Los cambios aplicados afectan a los tres; una rama Git no aísla la base |
| Pruebas destructivas o descartables | PostgreSQL aislado, nunca la base compartida |
| Archivos y modelos | Los volúmenes Docker siguen siendo locales; mover PostgreSQL no comparte adjuntos, PDFs ni modelos |

Un evento guardado en la base común se ve al consultar/actualizar la pantalla
con permisos. No se promete actualización automática en vivo si el módulo no
la implementa. Una tabla puede verse en el panel, pero para usarla desde Prisma
los compañeros también deben recibir el cambio de esquema/código y reconstruir
el cliente generado. GitHub no sincroniza registros entre bases distintas.

Compartir datos no significa que un estudiante pueda ver casos ajenos. Mantener
institución, titular, equipo y políticas comunes en NestJS. React consume NestJS;
no se añade un acceso directo paralelo desde React a tablas Supabase.

## Antes de conectar a los compañeros

Roberto coordina esta entrega de transición; los agentes de Johan/Jasmine no la
ejecutan unilateralmente por leer un plan. La entrega debe registrar:

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

Hasta esa entrega pueden avanzar en código, contratos y pruebas locales de la
semana solicitada, manteniendo cerrado lo que dependa de servicios no disponibles.
No inventar identidades, catálogos o servicios para eludir una dependencia.

## Cómo proponer y aplicar cambios de estructura

Los tres escriben el backend y las migraciones de sus módulos. Roberto coordina
su orden, relaciones comunes y aplicación a la base compartida. Prisma y
`apps/api/prisma` siguen siendo la única fuente de esquema/migraciones de negocio;
no crear una segunda historia de las mismas tablas con Supabase CLI o SQL suelto.

1. **Consultar:** antes de crear una tabla/columna/índice, revisar esquema actual,
   migraciones aplicadas, ramas activas y cambios anunciados. Confirmar que no
   existe ya ni está reservada por otro módulo.
2. **Proponer:** anotar responsable, rama/commit, archivo de migración, tablas
   afectadas, relaciones, consumidores y finalidad en
   [REGISTRO_CAMBIOS_BD.md](REGISTRO_CAMBIOS_BD.md).
3. **Preparar y validar:** guardar la migración en Git, probarla sobre una base
   aislada y revisar compatibilidad con el código que siguen ejecutando los otros.
   Preferir cambios aditivos compatibles; coordinar renombrados, restricciones
   nuevas y eliminaciones antes de ejecutarlos.
4. **Coordinar con Roberto:** compartir el cambio concreto y su impacto. Si ya
   está autorizado en la sesión, proceder dentro de ese alcance sin pedir otra
   confirmación idéntica. Tener rol Developer/colaborador no equivale a autorizar
   cualquier cambio remoto. Sin autorización, continuar tareas independientes.
5. **Aplicar de uno en uno:** Roberto o el integrante expresamente autorizado
   ejecuta la migración revisada sobre el proyecto/entorno confirmado. Registrar
   quién la aplicó, versión exacta y resultado. Una sola aplicación por cambio.
6. **Verificar y avisar:** comprobar estructura, datos y consumidores; actualizar
   el registro y los contratos/OpenAPI que correspondan. Cada integrante actualiza
   su rama de forma coordinada y reconstruye cliente Prisma/backend si lo necesita.
7. **Integrar:** entregar el cambio completo a main mediante revisión de Roberto;
   conservar en Git todas las migraciones remotas ya aplicadas. No editarlas ni
   borrarlas para resolver conflictos; la corrección lleva una migración nueva.

Un cambio común pequeño puede aprobarse, probarse y aplicarse al entorno de
desarrollo **antes de fusionar el módulo completo** para desbloquear al equipo.
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
