---
responsable: Jasmine
revision: 2026-11-11
estado: base_supabase_conectada_invitaciones_enviadas
pantallas_asignadas: [P09, P10, P11, P12, P15, P20, P21, P22, P23]
---

# Plan de implementación de CampusITSM para Jasmine

## Base común publicada — 11 de noviembre de 2026

Roberto autorizó la integración en main de acceso/dashboard, permisos efectivos
y matriz P21 con casillas, junto con la revisión documental del primer avance.
Leer [la publicación](../docs/entregas/roberto-publicacion-acceso-roles.md) y
[el contrato](../docs/CONTRATO_ROLES_PERMISOS.md). Incorporar origin/main en la
rama propia sin descartar avances y reconstruir la instalación habitual.

El principal autenticado resuelve permisos vigentes desde RoleAccess; comprobar
principal.permissions y el alcance del objeto, sin autorizar con una lista fija
del rol. La migración de permisos ya está aplicada en la base compartida: no
repetirla ni modificarla. P20/Usuarios sigue con Jasmine; esta parte P21 ya fue
entregada por solicitud de Roberto y se reutiliza. Tickets de Johan siguen en su
rama pendiente de integración/aplicación. Adjuntos/Storage permanecen pospuestos
para el primer avance; esta publicación no inicia otras semanas.


Este plan está dirigido exclusivamente a Jasmine y su agente. Eres responsable del frontend y backend de administración de usuarios/permisos, consentimiento, constancias, privacidad, auditoría y reportes. Roberto asume P01, Supabase Auth y la autorización común. Ejecuta únicamente la semana que Jasmine indique.

## Estado vigente y punto de partida — 7 de noviembre de 2026

La base de negocio ya está trasladada a Supabase y la instalación de Roberto
está conectada. Identidad y transición están publicadas en `main` por autorización
de Roberto del 7 de noviembre de 2026; obtener esa base antes de crear su rama.
Cada persona ejecuta su aplicación Docker; al recibir la conexión privada usará
los mismos usuarios, roles, eventos y datos autorizados. Leer
[OPERACION_SUPABASE.md](../docs/OPERACION_SUPABASE.md),
[COLABORADORES_SUPABASE.md](../docs/COLABORADORES_SUPABASE.md),
[COORDINACION_SUPABASE.md](../docs/COORDINACION_SUPABASE.md),
[ESTADO_EQUIPO.md](../docs/ESTADO_EQUIPO.md) y
[REGISTRO_CAMBIOS_BD.md](../docs/REGISTRO_CAMBIOS_BD.md).

| Área | Situación comprobada |
| --- | --- |
| Main | Identidad 8b02d6f, transición 864413a y coordinación integradas en main; partida 02d10f5. Sincronizar y registrar SHA actual |
| Supabase | Proyecto CampusITSM en organización gratuita exclusiva CampusITSM (exhurkcxcrjlskvldchp), esquema campusitsm; UUID/datos conservados |
| Docker | web/api/predictions en localhost:8080; PostgreSQL local detenido con volumen conservado |
| Migraciones | Manuales y separadas del arranque; un historial Prisma. La API verifica las migraciones requeridas sin aplicarlas |
| Sesiones | Cifradas por instalación con claves propias; usuarios/permisos compartidos |
| Johan/Jasmine | Invitaciones Developer enviadas, pendientes de aceptar; código/conexión privada por entregar. Roberto sigue Owner; VEXOR separado |
| Conector del agente | Autorizar organización CampusITSM; el conector previo de este chat solo tenía RobertoC1006. Leer COLABORADORES_SUPABASE |
| Correo externo | SMTP propio pendiente; no desactivar confirmación ni duplicar Auth |
| Alcance | Mismos módulos/pantallas/semanas; no se iniciaron tickets, CSV, IA o predicción |

Actualizar main con la entrega autorizada de identidad/base compartida y crear
la rama personal del módulo desde esa base; no reconstruir otro login o infraestructura.
Una sola instalación de trabajo campusitsm por computadora. No copiar claves de
cifrado ajenas ni respaldos privados; generar la propia. Los archivos/modelos
siguen siendo locales. No ejecutar semillas masivas o pruebas destructivas en
Supabase. Una rama Git no aísla sus datos.

Dentro del módulo asignado, las tablas/columnas/índices compatibles se validan,
versionan, aplican con el comando manual y registran/avisan sin permiso por tabla.
Consultar antes cambios comunes, de otros módulos o incompatibles. No borrar
tablas/datos ni editar migraciones aplicadas. No crear otro login o catálogo.

## Contexto completo y alcance acordado

CampusITSM es una mesa de ayuda para la Universidad Privada Tallán, institución ficticia del caso académico. Tiene tres casos de uso:

1. **CU01:** usuario registra una incidencia y evidencia; el sistema clasifica, consulta el contexto académico y prioriza; TI atiende y resuelve; el usuario sigue el avance.
2. **CU02:** el titular solicita una constancia después de resolver y confirmar la falla; el sistema genera PDF/QR y permite verificar emisión y archivo.
3. **CU03:** se preparan datos históricos, se evalúa un modelo y se pronostica demanda; se generan alertas; supervisor y administrador preparan recursos y gobiernan el sistema.

El equipo es Roberto, Johan y Jasmine. Cada integrante hace frontend, backend y pruebas de sus módulos. Roberto coordina integración. Hay cuatro semanas relativas al inicio efectivo, sin fechas de calendario fijadas, con 11–20 horas semanales por persona. La cuarta semana se reserva principalmente para integración, pruebas y correcciones.

Este plan y su paquete incluyen el contexto necesario para comenzar sin otra conversación; los documentos compartidos y el código vigente se revisan en cada sesión. Los [casos de uso y catálogo](../diseno/campusitsm/CASOS_DE_USO_Y_PANTALLAS.md) son material complementario; las instrucciones actuales acordadas aquí actualizan las decisiones abiertas de ese catálogo.

**Primera versión acordada:** frontend/backend y Python en Docker de cada integrante, una misma base de negocio PostgreSQL de desarrollo en Supabase y Supabase Auth alojado para una institución/equipo; calendario manual/CSV, PDF verificable y notificaciones internas. La transición está verificada para Roberto; faltan accesos/configuración privada de compañeros. Registro propio elegido por Roberto; envío de confirmaciones externas pendiente de SMTP. No se incluyen inicio institucional externo, integración académica real, correo de notificaciones generales, firma digital certificada, reapertura/cierre adicional, multiinstitución ni publicación pública de frontend/backend.

La clasificación por IA y el pronóstico son componentes distintos. El proveedor con opción gratuita de clasificación se elegirá con Roberto cuando llegue ese módulo; no asumir que un proveedor sigue siendo gratuito ni contratarlo unilateralmente. El pronóstico se ejecutará localmente en Python.

### Stack único

| Capa | Decisión |
| --- | --- |
| Frontend | React + Vite + TypeScript; React Router para navegación; TanStack Query para datos del servidor |
| Diseño | Base visual compartida de casos-gestion; DM Sans/Manrope, Phosphor y CSS con tokens; Recharts al implementar gráficos |
| Backend | Una API NestJS modular en TypeScript, prefijo `/api/v1`, contratos OpenAPI |
| Identidad | Supabase Auth alojado y autorización NestJS implementados en rama de Roberto, pendientes de integración en main |
| Persistencia | Una base de desarrollo compartida en Supabase, Prisma y migraciones versionadas; conexión verificada; PostgreSQL aislado para pruebas |
| Predicciones | Python con pandas y statsmodels, expuesto solo al backend mediante servicio interno |
| Tareas | pg-boss sobre PostgreSQL; tareas persistentes sin añadir Redis en esta versión |
| Ejecución | Docker de cada integrante para web/api/predictions; conexión PostgreSQL remota compartida. db local solo para pruebas; migración remota separada del arranque |
| Actualizaciones | Eventos del servidor para tickets/notificaciones; al reconectar se vuelve a consultar estado actual |
| Pruebas | Pruebas unitarias de dominio, integración con PostgreSQL, recorridos Playwright y comprobación visual |

La infraestructura compartida debe fijar versiones compatibles y archivos de bloqueo, configuración de ejemplo sin secretos, salud y volúmenes para datos, archivos y modelos. Las claves solo se configuran en el servidor. No conectar React directamente a PostgreSQL o Python.

### Base recibida y organización actual

Repositorio: `https://github.com/RobertoC1006/proyecto-gestion.git`.
Obtener main después de la integración de la PR #2 y registrar su commit exacto.
La base Docker anterior es `196a2144aae253ca672eeeaf721c62204516245a` y la base visual es `047d1a2e0fd4f71bb189ff301cacb6e1f21019cf`.

- `apps/web`: React/Vite/TypeScript, React Router, TanStack Query y componentes compartidos.
- `apps/api`: una API modular NestJS con Prisma, OpenAPI y módulo académico.
- `apps/api/prisma`: esquema y migraciones únicos, coordinados por Roberto.
- `services/predictions`: solo salud/esqueleto interno; no hay pronóstico real.
- `diseno/campusitsm`, `planes` y `docs`: referencias y entregas ya publicadas.
- `front-vistas` quedó preservada en la historia; no es una nueva base que integrar.

Las rutas efectivas se comprueban en OpenAPI. Tickets y constancias mantienen
contratos pendientes; identidad tiene código y contrato operativo en la rama
8b02d6f, pendientes de integración en main. El calendario ya implementa
`/academic/me/events` y consultas internas; `/academic/context` no está implementada,
y el cálculo del factor corresponde a semana 2. No duplicar ese servicio.

## Trabajo coordinado sin duplicación

### Responsables y límites

| Responsable | Propiedad principal | Pantallas propias |
| --- | --- | --- |
| Roberto | Base Docker/esquema/contratos; P01, Supabase Auth y autorización común; calendario/configuración, predicción y notificaciones | P01, P13, P14, P16, P17, P18, P19, P24 |
| Johan | Componentes visuales compartidos, tickets, prioridad, seguimiento, atención y clasificación | P02, P03, P04, P05, P06, P07, P08 |
| Jasmine | Administración de usuarios/permisos sobre la identidad común de Roberto; consentimiento, constancias, privacidad, auditoría y reportes | P09, P10, P11, P12, P15, P20, P21, P22, P23 |

La base visual compartida ya existe: reutilizar `ui.tsx`, `AppHeader`, `Sidebar`, `Dialog` y `PriorityBadge`. Johan coordina su evolución, no debe rehacerla. Ampliar los componentes comunes de forma acordada, sin duplicar controles ni módulos.

Las reglas viven en servicios NestJS, no en componentes React. Las vistas solicitan acciones y muestran resultados. Python recibe datos analíticos y no replica la prioridad de los tickets.

### Contratos y archivos compartidos

Ya existen `PROYECTO.md`, `docs/CONTRATOS.md`, `docs/ESTADO_EQUIPO.md`, `docs/DISENO_COMPONENTES.md`, `docs/CONTRATO_CALENDARIO.md` y `docs/CONTRATO_IDENTIDAD.md`. Consultarlos antes de modificar consumidores. El estado del equipo identifica entregas reales, contratos propuestos y dependencias pendientes.

Contratos mínimos que deben acordarse antes de implementar sus consumidores:

| Dominio | Responsable | Capacidades públicas/internas que debe proporcionar |
| --- | --- | --- |
| Identidad/autorización | Roberto | Supabase Auth, login/logout, sesión, usuario actual, rol, permisos, institución/equipo y autorización por objeto |
| Administración y consentimiento | Jasmine | P20/P21, perfiles/estado/equipo, consentimientos y auditoría usando la identidad y políticas de Roberto |
| Contexto académico | Roberto | Cursos/secciones y asociaciones; eventos aplicables al usuario/curso/fecha; factor y motivo; configuración versionada de SLA |
| Tickets | Johan | Crear/listar/consultar con permisos, adjuntos, asignación, clasificación/ajuste, historial, plazos, resolución y confirmación de falla |
| Constancias | Jasmine | Elegibilidad, emisión idempotente, PDF privado, consulta pública mínima y comprobación de archivo |
| Analítica | Roberto | Series observadas, pronósticos, modelos/evaluaciones, unidades, periodo, fuente y capacidad configurada |
| Reportes | Jasmine | Presentación/exportación autorizada usando consultas y resultados analíticos comunes, sin un segundo cálculo de prioridad/pronóstico |
| Notificaciones | Roberto | Publicar avisos por destinatario, listar, marcar leídos, alertas revisables y eventos para actualización |
| Auditoría | Jasmine | Registrar actor, instante, acción, objeto y cambios; lectura/exportación autorizadas, sin edición desde la aplicación |

Los nombres concretos de rutas y DTO se fijan en `docs/CONTRATOS.md` antes de desarrollar pantallas consumidoras. Identificar estados, campos obligatorios, permisos, paginación, errores y ejemplos. Compartir tipos desde OpenAPI, no copiar modelos Prisma al navegador. No tratar un contrato propuesto en otra rama como si ya estuviera integrado.

Cada integrante escribe y valida las migraciones de su módulo en el único esquema Prisma. Una vez habilitados Supabase compartido y sus accesos, puede crear tablas, columnas e índices nuevos de su módulo, compatibles y dentro del plan, sin pedir permiso por cada cambio. Revisar primero lo existente y las ramas, guardar archivo/commit en Git, validar y registrar/avisar qué se aplicó. Solo quien vaya a programar funciones sobre una tabla nueva necesita actualizar su modelo/código y reconstruir la aplicación si corresponde; ver la tabla en el panel o consultar nuevos registros no requiere reconstruir Docker. Consultar previamente cambios en otros módulos, identidad/permisos comunes o incompatibles. No borrar tablas/datos existentes. Puede aplicarse una migración ordinaria delegada antes de fusionar todo el módulo; main sigue bajo revisión de Roberto. Conservar el historial exacto de migraciones y compartir dependencias. Ver COORDINACION_SUPABASE y REGISTRO_CAMBIOS_BD.

### Revisión de ramas antes de trabajar

Hacer esta revisión al iniciar una sesión, al comenzar un módulo, al recibir una entrega y antes de integrar:

1. Revisar `git status --short --branch`; identificar trabajo propio y ajeno sin confirmar. No descartarlo, guardarlo automáticamente ni cambiar de rama con modificaciones que puedan perderse.
2. Actualizar referencias con `git fetch origin --prune` y consultar `git branch -a -vv` y el historial de `origin/main`. Si no hay red, registrar que no se verificó GitHub; no afirmar que se está actualizado.
3. Revisar diferencias de la rama de trabajo frente a `origin/main` y los cambios recientes de ramas activas de los compañeros con `git log`, `git diff` y `git show`, sin modificarlas.
4. Leer `PROYECTO.md`, contratos, estado del equipo y entregas vigentes. Si aún no existen, distinguir la base pendiente de un archivo eliminado por error.
5. Confirmar que la funcionalidad requerida no existe ya ni está siendo implementada por otra persona. Anotar dependencias de contratos no integrados.
6. Actualizar la rama mediante integración normal de `origin/main`, resolver conflictos sin pisar trabajo ajeno y repetir las comprobaciones afectadas.

Leer una rama ajena no autoriza a hacer checkout sobre su trabajo local, fusionarla, copiar servicios todavía no acordados o eliminarla. No utilizar `reset --hard`, borrado forzado o push forzado como limpieza rutinaria.

### Ciclo de ramas por módulo

Crear cada rama desde `main` actualizado; un módulo puede continuar entre semanas. Los nombres no llevan `codex/` ni prefijos similares. Puede haber tres ramas de módulo activas, una por integrante.

Entregar commit y PR a Roberto. Tras verificar e integrar, publicar `main`, comprobar que contiene todo el trabajo del módulo y eliminar únicamente esa rama local y remota. Usar borrado local normal, sin forzarlo. Nunca borrar `main`, una rama de otro integrante o una rama con cambios pendientes.

La limpieza se hace por módulo, no por calendario. Si un módulo sigue abierto, conservar su rama; no borrar trabajo para aparentar una entrega semanal. No iniciar el módulo dependiente hasta que su base esté disponible.

## Reglas comunes del sistema

- Roles: `estudiante`, `docente`, `ti_agente`, `ti_supervisor`, `administrador`. El servidor determina el rol; no se eligen privilegios desde el encabezado.
- Estudiante/docente ven sus casos; agente, tickets del equipo autorizado; supervisor, operación/analítica autorizada; administrador, configuración/gobierno. Público solo consulta mínima de constancias. Comprobar siempre permisos en la API y en descargas.
- Supabase Auth gestionará credenciales. Roberto define una única sesión/autorización de servidor, conservando cookies HttpOnly y protección de escrituras; no duplicar contraseñas. No guardar tokens, credenciales ni datos de negocio en localStorage. Consultar el contrato operativo de rama en `docs/CONTRATO_IDENTIDAD.md` y el estado de su integración.
- Fechas guardadas en UTC, mostradas en `America/Lima`. SLA inicial continuo, sin descontar noches o feriados.
- Estados iniciales: `registrado`, `clasificado`, `en_atencion`, `resuelto`. Mantener estado de clasificación independiente si falta revisión. Confirmación de falla es un dato separado.
- Urgencia e impacto de 1 a 3. Factor: regular: 1; entrega con vencimiento futuro menor a 48 h: 1,5; matrícula en curso: 1,7; examen en curso o menor a 24 h: 2. Usar el máximo aplicable a ese usuario/curso.
- Puntaje = urgencia × impacto × factor. P1 ≥ 9; P2 ≥ 5 y < 9; P3 ≥ 3 y < 5; P4 < 3.
- Respuesta/resolución: P1 15 min/2 h; P2 1 h/4 h; P3 4 h/24 h; P4 8 h/72 h. Primera respuesta es atención humana, no el acuse o la clasificación.
- TI puede ajustar valores con motivo obligatorio y auditoría. Conservar antes/después e historial de plazos; no reiniciar el reloj para aparentar cumplimiento.
- Si falta IA o contexto confiable, conservar el ticket y derivarlo a revisión; no inventar factor, clasificación o prioridad baja.
- Adjuntos PNG/JPG/PDF de hasta 5 MB, validación del archivo, almacenamiento privado y descarga autorizada.
- Constancia del titular: ticket resuelto y falla confirmada. Emisión repetida no crea duplicados. PDF con QR real y huella final registrada; consulta pública con nombre enmascarado. La emisión no aprueba por sí misma una reprogramación.
- Predicción diaria a 14 días, referencia semanal frente a candidato SARIMAX, métricas calculadas y evaluación temporal. No aumentar automáticamente prioridades individuales por una alerta de demanda.
- Datos sintéticos separados/identificados. No atribuir eficacia real, satisfacción, cumplimiento o mejoras a las cifras de las imágenes.
- Auditoría desde las primeras operaciones; no registrar secretos ni contenido privado completo en logs.

La marca de la interfaz es CampusITSM, Universidad Privada Tallán. No confundir la institución ficticia con la universidad del curso.

## Fidelidad visual y reutilización

La estructura, campos y acciones se toman del cuadrante asignado en los mockups
finales. El acabado vigente usa la base visual que Roberto ya adaptó de
`RobertoC1006/casos-gestion`, no la vista provisional de front-vistas.
Esta decisión actualiza la indicación anterior de Lucide/estilos a reproducir
desde cero. Leer `docs/DISENO_COMPONENTES.md` antes de implementar una pantalla.

- Reutilizar `apps/web/src/components/ui.tsx`: Button/ButtonLink, Card/CardHeading,
  Field/Select, Notice, PageHeading, Modal, Breadcrumbs y estados compartidos.
- Mantener DM Sans/Manrope, Phosphor, tokens y estilos de `apps/web/src/app/globals.css`.
  Usar el Sidebar/AppHeader/layout existentes, sin otro menú ni otra cabecera.
- `Dialog` delega en el Modal común. No crear otro diálogo o catálogo de controles.
- Las vistas antiguas están aisladas bajo `.legacy-view`; al registrar rutas nuevas,
  coordinar el layout para que reciban los componentes vigentes, sin estilos de
  compatibilidad provisionales ni una nueva familia de controles.
- Ampliar componentes compartidos solo donde falte una capacidad real, revisar su
  efecto en calendario/acceso y documentar la entrega para los otros módulos.
- No importar localStorage, datos, cuentas, flujos ni reglas de Soluciona TI:
  únicamente se reutilizó su base visual para CampusITSM.

Conservar distribución, jerarquía, verde/menta, superficies y contenido de los
mockups, sustituyendo datos ilustrativos por datos reales. Un gráfico o QR debe
generarse desde su función, no copiarse como imagen. No inventar métricas.

Revisar capturas con viewport 1440 × 900 y adaptación 390 × 844; abrirlas y comparar
legibilidad, distribución, solapamientos, foco y estados. Las capturas con fixtures
deben identificarse como prueba visual y no demuestran un recorrido autenticado.
Cada entrega registra diferencias funcionales/visuales pendientes.

## Pantallas propias y mockups exactos

| Pantalla | Resultado a implementar | Referencia y posición |
| --- | --- | --- |
| P09 Mis constancias | Disponibles, emitidas, elegibilidad y solicitud | Lámina 3, arriba izquierda |
| P10 PDF de constancia | Vista, descarga y datos de emisión reales | Lámina 3, arriba derecha |
| P11 Verificación válida | Página pública mínima con datos enmascarados | Lámina 3, abajo izquierda |
| P12 Verificación no válida | Código inexistente/no válido y nueva consulta sin datos privados | Lámina 3, abajo derecha |
| P15 Reportes y comparación | Indicadores, observado/pronosticado, categorías y exportación autorizada | Lámina 4, abajo izquierda |
| P20 Usuarios y roles | Listar, editar, activar/desactivar y asignar alcance autorizado | Lámina 5, abajo derecha |
| P21 Matriz de permisos | Permisos y alcances efectivos por rol | Lámina 6, arriba izquierda |
| P22 Consentimientos y datos analíticos | Versiones/aceptaciones y preparación de conjunto sin identificadores directos | Lámina 6, arriba derecha |
| P23 Auditoría | Filtros, detalle antes/después y exportación de registros de solo lectura | Lámina 6, abajo izquierda |

### Acceso P01 — referencia de Roberto

P01 pasó a Roberto con Supabase Auth y no es una pantalla propia de Jasmine.
Tu P20/P21 consume su usuario actual y su autorización. La lámina 1 queda en
`diseno/campusitsm/01_cu01_ingreso_reporte_v2.png` como referencia compartida,
sin implementar otro login o selector de privilegios.

### Lámina 3 — P09 a P12

Archivo final: `03_cu02_constancias.png`. Implementar las cuatro pantallas.

![Mockups de constancias: Jasmine implementa P09 a P12](../diseno/campusitsm/03_cu02_constancias.png)

### Lámina 4 — P15

Archivo final: `04_cu03_predicciones_alertas.png`. P13, P14 y P16 son de Roberto.

![Mockups de reportes: Jasmine implementa únicamente P15](../diseno/campusitsm/04_cu03_predicciones_alertas.png)

### Lámina 5 — P20

Archivo final: `05_cu03_calendario_configuracion.png`. P17–P19 son de Roberto.

![Mockups de usuarios: Jasmine implementa únicamente P20](../diseno/campusitsm/05_cu03_calendario_configuracion.png)

### Lámina 6 — P21, P22 y P23

Archivo final: `06_cu03_permisos_privacidad_auditoria_v2.png`. P24 es de Roberto.

![Mockups de permisos y auditoría: Jasmine implementa P21, P22 y P23](../diseno/campusitsm/06_cu03_permisos_privacidad_auditoria_v2.png)

## Antes de comenzar — Obtener Docker, diseño y contratos vigentes

La base Docker de Roberto ya está publicada. La entrega de componentes/calendario
se libera por PR #2; comprobar su integración en main antes de consumirla.

1. Revisar Git conservando trabajo propio y obtener el commit vigente de main.
2. Recibir la configuración/commit compartidos habilitados por Roberto y reconstruir
   tu misma instalación. Antes de la transición, el Compose sigue siendo local;
   no apuntar su migración automática a Supabase ni crear otra base principal.
3. Leer `docs/DISENO_COMPONENTES.md`, `docs/CONTRATO_IDENTIDAD.md` y
   `docs/CONTRATO_CALENDARIO.md`. Los componentes ya existen: no esperar otro diseño.
4. Coordinar con Roberto los perfiles/equipo y la relación con la identidad Supabase
   antes de añadir migraciones. P01 y las guardias comunes pertenecen a Roberto.
5. Preparar consentimiento/auditoría y administración como dominios propios; si
   falta acceso real, mantener endpoints cerrados y usar fixtures solo en pruebas.
6. Entregar a Roberto el contrato de auditoría para integrar AcademicChange.

Tu siguiente base funcional depende de la identidad de Roberto, no de crear otra
sesión local ni otra tabla de contraseñas. El paquete del plan no contiene claves.

## Semana 1 — Administración de usuarios, consentimiento y auditoría inicial

**Rama:** `administracion-usuarios`, desde main con la base compartida.
La rama antigua prevista `accesos-usuarios` se sustituye por este alcance; no hay
trabajo remoto de Jasmine que borrar o renombrar sin revisar su estado real.

### Backend y servicios compartidos

- Recibir de Roberto sesión validada, usuario actual, directorio canónico, roles,
  permisos y autorización por objeto. No implementar P01, passwords, login/logout,
  renovación o verificación Supabase en un servicio paralelo.
- Implementar administración de perfiles, estado y equipo desde NestJS, autorizada
  por las políticas comunes. Las operaciones sensibles de cuenta/rol se delegan al
  servicio central de Roberto, incluida la protección del último administrador.
- Definir el consentimiento explícito con versión y fecha, ligado al usuario
  canónico. Una casilla no marcada no debe producir aceptación.
- Crear la auditoría inicial con actor validado, acción, objeto y cambios permitidos,
  evitando claves, tokens, passwords y archivos privados completos.
- Acordar transacciones/entrega persistente con Roberto e integrar AcademicChange;
  no crear un segundo historial académico ni perder sus cambios ya registrados.
- Coordinar esquema/migraciones y privilegios. No exponer edición/borrado de auditoría.

### Pantallas

Completar P20 básico con la base visual ya publicada. P01 pertenece a Roberto.
Reutilizar la matriz P21 publicada por Roberto por su solicitud del 11 de noviembre;
muestra y guarda permisos efectivos del servicio común. No crear otro catálogo
o motor de permisos independiente.
Registrar rutas nuevas sin estilos provisionales `.legacy-view` y reutilizar los
componentes que ya usan P17/P18. La cabecera muestra el rol validado por el servidor.

### Aceptación

- [ ] P20 permite las acciones autorizadas sobre perfiles/estado/equipo y conserva los cambios.
- [ ] Sin permiso o cambiando un identificador no se administran cuentas ajenas.
- [ ] Las operaciones de cuenta/rol consumen el servicio de Roberto y protegen al último administrador.
- [ ] Consentimiento conserva versión/instante y no se acepta sin acción explícita.
- [ ] Auditoría registra cambios y puede recibir los eventos académicos sin duplicarlos.
- [ ] P20 aplica los componentes vigentes y distingue estados de error/carga/pendencia.

**Demostración:** cuando Roberto integre acceso real, entrar como administrador,
administrar un perfil permitido y consultar consentimiento/auditoría. Sin ese
contrato no afirmar que se probó un recorrido autenticado completo.

## Semana 2 — Emisión y verificación de constancias

**Rama:** integrar administración de usuarios; después `constancias-verificables`. Consumir identidad de Roberto y tickets de Johan.

### Backend

- Consumir la consulta autorizada de tickets de Johan. No copiar el ticket a otra tabla para mantener un estado alternativo.
- Centralizar en Constancias la elegibilidad: solicitante titular, resuelto y falla confirmada.
- Mantener una emisión reutilizable por ticket; solicitudes simultáneas o repetidas no producen múltiples documentos accidentalmente.
- Guardar snapshot de la atención y generar PDF real con código, servicio, instantes, duración, actividad y QR real.
- Usar `Firma institucional · prototipo`; no presentar un certificado legal inexistente.
- Para mostrar una huella dentro del PDF, usar una huella de datos canónicos de la constancia. Calcular por separado SHA-256 de los bytes finales y guardarlo en servidor para verificar el archivo: no intentar imprimir en el PDF su propia huella final.
- Descargar únicamente al usuario autorizado. El QR apunta a dirección configurable; para un teléfono, coordinar URL de red accesible con Roberto, no localhost.
- La consulta pública de código muestra nombre enmascarado, fecha y servicio, sin correo, adjuntos ni historial privado.
- Añadir comprobación de PDF frente a la huella registrada. Limitar tamaño, no conservar arbitrariamente archivos enviados por terceros y no confundir un código válido con prueba de que cualquier PDF está intacto.
- Registrar emisión y verificaciones relevantes con datos mínimos y publicar el aviso correspondiente mediante el servicio de Roberto cuando esté integrado.

### Frontend

P09 separa elegibles de emitidas y muestra claramente por qué un caso aún no permite solicitud. P10 renderiza el PDF generado, no una composición HTML fingiendo descarga. P11/P12 son públicas, sin sidebar ni avatar de sesión. Incluir en la consulta una acción clara para comprobar el archivo, conservando el diseño.

### Aceptación

- [ ] Un caso sin confirmar falla no permite emitir aunque esté resuelto.
- [ ] Cambiar el identificador no permite emitir/descargar una constancia ajena.
- [ ] El PDF se abre y se conserva idéntico para descargas de la misma emisión.
- [ ] El código válido encuentra emisión; el inexistente no muestra datos.
- [ ] El PDF original verifica y un cambio de bytes invalida su integridad.
- [ ] Un QR de emisión válido no hace que un archivo alterado sea aceptado.
- [ ] Repetir o hacer dos solicitudes simultáneas no duplica la emisión.
- [ ] P09–P12 conservan la estructura del mockup, sustituyendo QR/hash ilustrativos por reales.

**Demostración conjunta:** Johan resuelve/confirma; titular solicita; se descarga, escanea/consulta y compara archivo original frente a alterado.

## Semana 3 — Permisos, privacidad, auditoría y P15

**Ramas en secuencia:** `privacidad-auditoria` y `reportes-operativos`. Coordinar anticipadamente el contrato analítico; no dejar la consulta de P15 para el último día.

### Gobierno y privacidad

- Completar P20 sobre los permisos efectivos y reutilizar P21 publicada, conservando alcance propio/equipo/institución y cambios registrados.
- Respetar el contrato de autorización que consumen compañeros; no sustituirlo por comprobaciones diferentes en cada pantalla.
- Completar P22: consulta de aceptaciones/versiones y preparación de un conjunto analítico sin identificadores directos.
- Excluir nombres, correos, adjuntos y texto libre identificable del conjunto usado para conteos/predicción. Conservar solo variables necesarias, agregadas cuando sea posible.
- La preparación no elimina tickets operativos ni permite acceso público a históricos.
- Completar P23: filtros por fecha/actor/objeto/acción, detalle antes/después y exportación limitada al alcance autorizado.
- No ofrecer edición/borrado de auditorías ni afirmar que un diseño visual garantiza registros inalterables.

### Reportes

- Consumir los servicios de Roberto para series observadas, pronósticos, fuente, periodo y métricas.
- Consultar conteos operativos mediante servicios comunes de tickets/analítica; no mantener cifras calculadas por otra fórmula.
- Completar P15 con filtros reales, categorías y observado frente a pronosticado. Mantener unidades y periodos consistentes.
- Definir con los propietarios el denominador de cada porcentaje y el tratamiento de datos faltantes. Si no se puede calcular, mostrar no disponible, no cero.
- Mostrar claramente datos sintéticos y resultados ilustrativos hasta que haya mediciones; no atribuir satisfacción o mejoras que no se recolectan.
- Exportar datos filtrados/autorizados usando la misma consulta base, no un archivo fijo ni una consulta que ignore permisos.

### Aceptación

- [ ] P21 coincide con permisos que realmente aplica la API.
- [ ] P22 no expone identificadores directos en el conjunto analítico ni borra el historial.
- [ ] P23 permite reconstruir una resolución y sus cambios, sin posibilidad de editarlos.
- [ ] Exportaciones respetan filtros y permisos.
- [ ] P15 coincide con servicios analíticos y datos de origen; no recalcula el modelo.
- [ ] Las cinco pantallas administrativas/reportes están conectadas y comparadas con sus mockups.

## Semana 4 — Validación y entrega

**Rama:** `validacion-constancias`, después de integrar los módulos anteriores. Incluye correcciones de administración, privacidad y reportes de tu responsabilidad; cambios de autenticación se coordinan con Roberto.

1. Probar sesiones, cambios de rol, accesos por identificador, descargas y exportaciones con distintos usuarios.
2. Probar constancias de casos no elegibles, emisiones simultáneas, PDFs modificados y exposición de datos públicos.
3. Revisar auditoría completa de registro/ajuste/asignación/resolución/emisión/configuración con los otros módulos.
4. Comprobar filtros, periodos, valores ausentes y coherencia de P15 frente a P13/P16.
5. Comparar capturas de las nueve pantallas a 1440 × 900, revisar versión móvil 390 × 844 y estados de error/espera.
6. Aportar manual de administración, consulta de constancias, verificación y evidencias de aceptación.
7. Entregar a Roberto la lista real de problemas para integración y la demostración del CU02 y tus funciones de CU03.

**Cierre:** administración conectada a la identidad de Roberto, constancias verificables, privacidad y reportes conectados. No crear una implementación de predicción o notificaciones alternativa por falta de un endpoint de Roberto.

## Entrega semanal y regla de parada

Al terminar la semana solicitada, entregar un resumen y registrar `docs/entregas/<persona>-semana-0N.md`. El archivo debe distinguir terminado, pendiente y bloqueado; no incluir claves ni datos personales reales.

```text
Responsable:
Semana y módulo:
Rama:
Commit y PR:
Commit de origin/main utilizado:
Ramas de compañeros revisadas y dependencias detectadas:
Pantallas y acciones funcionales:
Contratos/esquema modificados y coordinación realizada:
Base de destino y estado de habilitación compartida:
Migraciones anunciadas/aplicadas, commit, alcance delegado o acuerdo común, ejecutor y verificación:
Cambios/dependencias comunicados a los otros módulos:
Pruebas ejecutadas y resultado:
Capturas comparadas con cada mockup:
Cómo reproducir la demostración:
Problemas conocidos y solicitudes a compañeros:
Condiciones necesarias para la siguiente semana:
```

No marcar un módulo terminado porque se ve bien si aún usa respuestas ficticias. No marcarlo fiel al diseño porque funciona si su apariencia difiere de los mockups.

**Detenerse después de entregar el avance.** No iniciar automáticamente la siguiente semana ni resolver módulos de otro integrante para eludir una dependencia. Si el integrante no indicó semana, empezar por revisar precondiciones y Semana 1. Puede continuarse con pruebas, documentación o tareas independientes de esa misma semana mientras se solicita un contrato pendiente.

La cuarta semana debe terminar con los tres casos integrados y las 24 pantallas funcionales. La disponibilidad 99,5 %, los 500 usuarios simultáneos y las metas académicas se evalúan y se reportan; no se afirman por instalar Docker ni se presentan como alcanzadas si las mediciones no lo respaldan.
