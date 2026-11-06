---
responsable: Johan
revision: 2026-11-06
estado: plan_de_implementacion_no_ejecutado
pantallas_asignadas: [P02, P03, P04, P05, P06, P07, P08]
---

# Plan de implementación de CampusITSM para Johan

Este plan está dirigido exclusivamente a Johan y su agente. Eres responsable del frontend y backend de incidencias y de los componentes visuales compartidos. No eres responsable de todo el frontend ni de un backend separado. Ejecuta solo la semana que Johan indique.

## Contexto completo y alcance acordado

CampusITSM es una mesa de ayuda para la Universidad Privada Tallán, institución ficticia del caso académico. Tiene tres casos de uso:

1. **CU01:** usuario registra una incidencia y evidencia; el sistema clasifica, consulta el contexto académico y prioriza; TI atiende y resuelve; el usuario sigue el avance.
2. **CU02:** el titular solicita una constancia después de resolver y confirmar la falla; el sistema genera PDF/QR y permite verificar emisión y archivo.
3. **CU03:** se preparan datos históricos, se evalúa un modelo y se pronostica demanda; se generan alertas; supervisor y administrador preparan recursos y gobiernan el sistema.

El equipo es Roberto, Johan y Jasmine. Cada integrante hace frontend, backend y pruebas de sus módulos. Roberto coordina integración. Hay cuatro semanas relativas al inicio efectivo, sin fechas de calendario fijadas, con 11–20 horas semanales por persona. La cuarta semana se reserva principalmente para integración, pruebas y correcciones.

Este archivo es autocontenido: no requiere otra conversación ni otro plan individual. Los [casos de uso y catálogo](../diseno/campusitsm/CASOS_DE_USO_Y_PANTALLAS.md) son material complementario; las instrucciones actuales acordadas aquí actualizan las decisiones abiertas de ese catálogo.

**Primera versión:** aplicación local completa en Docker, una institución y un equipo de soporte, cuentas propias, calendario manual/CSV, PDF verificable y notificaciones dentro de la aplicación. No se incluye todavía inicio de sesión institucional externo, integración académica real, correo, firma digital certificada, reapertura/cierre adicional, multiinstitución ni publicación en servidores. Esas ampliaciones no deben bloquear la entrega local.

La clasificación por IA y el pronóstico son componentes distintos. El proveedor con opción gratuita de clasificación se elegirá con Roberto cuando llegue ese módulo; no asumir que un proveedor sigue siendo gratuito ni contratarlo unilateralmente. El pronóstico se ejecutará localmente en Python.

### Stack único

| Capa | Decisión |
| --- | --- |
| Frontend | React + Vite + TypeScript; React Router para navegación; TanStack Query para datos del servidor |
| Diseño | Componentes reutilizables, CSS con tokens comunes, Lucide para iconos y Recharts para gráficos |
| Backend | Una API NestJS modular en TypeScript, prefijo `/api/v1`, contratos OpenAPI |
| Persistencia | Una base PostgreSQL por instalación, Prisma y migraciones versionadas |
| Predicciones | Python con pandas y statsmodels, expuesto solo al backend mediante servicio interno |
| Tareas | pg-boss sobre PostgreSQL; tareas persistentes sin añadir Redis en esta versión |
| Ejecución | Docker Compose con servicios `web`, `api`, `db`, `predictions`, más inicialización de migraciones/datos |
| Actualizaciones | Eventos del servidor para tickets/notificaciones; al reconectar se vuelve a consultar estado actual |
| Pruebas | Pruebas unitarias de dominio, integración con PostgreSQL, recorridos Playwright y comprobación visual |

La infraestructura compartida debe fijar versiones compatibles y archivos de bloqueo, configuración de ejemplo sin secretos, salud y volúmenes para datos, archivos y modelos. Las claves solo se configuran en el servidor. No conectar React directamente a PostgreSQL o Python.

### Estado inicial verificado el 6 de noviembre de 2026

Repositorio: `https://github.com/RobertoC1006/proyecto-gestion.git`.

- `main` local y en GitHub: `1501f5aaec13a77f3ebb79da52bf50d66e4e6678`; contiene únicamente README.
- `front-vistas` en GitHub y referencia `origin/front-vistas`: `a4896261f92507155f5f153f7476fd29d99d631b`.
- El frontend existe en `front-vistas`: React/Vite/TypeScript, componentes, cuatro tickets ficticios y vistas mayormente estáticas.
- El documento `PROYECTO.md` está en esa rama; todavía menciona Next.js, seis integrantes y decisiones anteriores. Roberto debe actualizarlo a lo acordado aquí.
- Los diseños y estos planes se preparan en carpetas locales que inicialmente no están publicadas. Su existencia en la computadora de Roberto no demuestra que los compañeros los tengan.
- Todavía no hay backend NestJS, Docker, PostgreSQL conectado ni IA real en el código revisado.

Esta es una fotografía de origen, no una condición permanente. El agente debe comprobar la situación real antes de cada avance; no sobrescribir trabajo posterior para volver a estos commits.

## Trabajo coordinado sin duplicación

### Responsables y límites

| Responsable | Propiedad principal | Pantallas propias |
| --- | --- | --- |
| Roberto | Docker, esquema/migraciones, contratos comunes, calendario/configuración, predicción y notificaciones | P13, P14, P16, P17, P18, P19, P24 |
| Johan | Componentes visuales compartidos, tickets, prioridad, seguimiento, atención y clasificación | P02, P03, P04, P05, P06, P07, P08 |
| Jasmine | Identidad, permisos, consentimiento, constancias, privacidad, auditoría y reportes | P01, P09, P10, P11, P12, P15, P20, P21, P22, P23 |

Reutilizar primero `AppHeader`, `Sidebar`, `PriorityBadge` y las vistas existentes; mejorarlos de manera coordinada. Crear una sola familia compartida de formularios, botones, tablas, tarjetas, filtros, diálogos y estados. No duplicar módulos para poder avanzar.

Las reglas viven en servicios NestJS, no en componentes React. Las vistas solicitan acciones y muestran resultados. Python recibe datos analíticos y no replica la prioridad de los tickets.

### Contratos y archivos compartidos

Roberto publicará `PROYECTO.md` actualizado, `docs/CONTRATOS.md` y `docs/ESTADO_EQUIPO.md` al entregar la base. Son archivos a crear, no prerrequisitos ya existentes. El último registra base utilizable, commit, ramas/responsables y dependencias pendientes.

Contratos mínimos que deben acordarse antes de implementar sus consumidores:

| Dominio | Responsable | Capacidades públicas/internas que debe proporcionar |
| --- | --- | --- |
| Identidad | Jasmine | Login/logout, usuario actual, rol, permisos, equipo, consentimiento y autorización por objeto |
| Contexto académico | Roberto | Cursos/secciones y asociaciones; eventos aplicables al usuario/curso/fecha; factor y motivo; configuración versionada de SLA |
| Tickets | Johan | Crear/listar/consultar con permisos, adjuntos, asignación, clasificación/ajuste, historial, plazos, resolución y confirmación de falla |
| Constancias | Jasmine | Elegibilidad, emisión idempotente, PDF privado, consulta pública mínima y comprobación de archivo |
| Analítica | Roberto | Series observadas, pronósticos, modelos/evaluaciones, unidades, periodo, fuente y capacidad configurada |
| Reportes | Jasmine | Presentación/exportación autorizada usando consultas y resultados analíticos comunes, sin un segundo cálculo de prioridad/pronóstico |
| Notificaciones | Roberto | Publicar avisos por destinatario, listar, marcar leídos, alertas revisables y eventos para actualización |
| Auditoría | Jasmine | Registrar actor, instante, acción, objeto y cambios; lectura/exportación autorizadas, sin edición desde la aplicación |

Los nombres concretos de rutas y DTO se fijan en `docs/CONTRATOS.md` antes de desarrollar pantallas consumidoras. Identificar estados, campos obligatorios, permisos, paginación, errores y ejemplos. Compartir tipos desde OpenAPI, no copiar modelos Prisma al navegador. No tratar un contrato propuesto en otra rama como si ya estuviera integrado.

Roberto administra archivos globales y migraciones; Johan, componentes y navegación compartidos; Jasmine, identidad y auditoría. Solicitar cambios a su responsable y obtener la actualización acordada antes de introducir otra implementación. Las migraciones pendientes se revisan secuencialmente sobre `main`; nunca editar una migración ya aplicada para resolver un conflicto.

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
- Sesiones en PostgreSQL, contraseñas protegidas, cookies HttpOnly y protección de operaciones de escritura. No guardar credenciales ni datos de negocio en localStorage.
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

Las imágenes finales son la referencia de implementación, no inspiración para otro diseño. Examinar el cuadrante correspondiente sin los rótulos externos de la lámina. Implementar controles, datos, navegación y gráficos reales.

Conservar menú, cabecera, jerarquía, proporciones, verde/menta, superficies claras, bordes, sombras y estilo de iconos. Cambiar solamente ejemplos, textos ilustrativos y errores tipográficos cuando lo exija el funcionamiento. No copiar un QR ilustrativo o un gráfico como imagen: generar su contenido real.

Usar un viewport de escritorio de 1440 × 900 para las capturas de revisión; comparar cada pantalla con su cuadrante escalado. Comprobar también 390 × 844 para móvil: adaptación accesible del mismo diseño, sin inventar otro sistema visual. El agente debe abrir las capturas y revisar distribución, solapamientos, textos y controles; no basta una compilación correcta.

Cada cierre semanal debe adjuntar captura implementada, imagen de referencia y diferencias pendientes. Ninguna imagen de ejemplo prueba que la funcionalidad esté implementada.

## Pantallas propias y mockups exactos

| Pantalla | Resultado a implementar | Referencia y posición |
| --- | --- | --- |
| P02 Inicio del estudiante | Resumen personal, actividad propia, acceso a reporte y próximo evento correspondiente | Lámina 1, arriba derecha |
| P03 Nueva incidencia | Descripción, servicio, curso, evidencia y envío validado | Lámina 1, abajo izquierda |
| P04 Reporte recibido y clasificación | Identificador, progreso, prioridad y acciones según el estado real | Lámina 1, abajo derecha |
| P05 Mis incidencias | Solo casos propios, búsqueda, filtros, estados y detalle | Lámina 2, arriba izquierda |
| P06 Seguimiento | Datos, evidencia, plazos y línea de tiempo actualizada | Lámina 2, arriba derecha |
| P07 Cola de TI | Tickets autorizados abiertos, prioridad, filtros, orden y asignación | Lámina 2, abajo izquierda |
| P08 Atención y resolución | Contexto, puntaje, ajustes, antecedentes, SLA y resolución | Lámina 2, abajo derecha |

### Lámina 1 — P02, P03 y P04

Archivo final: `01_cu01_ingreso_reporte_v2.png`. P01 es de Jasmine; utilizar su acceso.

![Mockups de ingreso y reporte: Johan implementa P02, P03 y P04](../diseno/campusitsm/01_cu01_ingreso_reporte_v2.png)

### Lámina 2 — P05 a P08

Archivo final: `02_cu01_seguimiento_atencion_v2.png`. Implementar las cuatro pantallas.

![Mockups de seguimiento y atención: Johan implementa P05 a P08](../diseno/campusitsm/02_cu01_seguimiento_atencion_v2.png)

## Antes de comenzar — Verificar la base Docker de Roberto

No preparar otra infraestructura para avanzar. Roberto debe publicar primero la base en `main`, el commit utilizable, configuración de ejemplo, migraciones y contratos.

1. Revisar ramas y cambios según el procedimiento de este plan; conservar trabajo local.
2. Obtener el commit publicado y revisar las instrucciones de arranque.
3. Crear configuración local a partir del ejemplo, sin copiar secretos de Roberto.
4. Construir en tu Docker los mismos servicios mediante `docker compose up --build` y verificar su salud.
5. Aplicar la inicialización documentada y confirmar persistencia después de reiniciar sin borrar volúmenes.
6. Confirmar dónde viven frontend, API y contratos. No confundir la ausencia temporal de un endpoint con autorización para implementar identidad o calendario por duplicado.

Cada compañero tiene una base PostgreSQL y volúmenes independientes en su equipo; comparten código, contratos y migraciones, no una base de la computadora de Roberto.

Mientras se publica la base, revisar mockups, componentes existentes y contratos propuestos. Se permite preparar pruebas de componentes con fixtures identificados; no marcar una pantalla conectada usando esos datos ni habilitar APIs sin autorización como atajo.

## Semana 1 — Componentes compartidos y reporte persistente

**Ramas:** `componentes-compartidos` y, después de integrar su base, `gestion-incidencias`.

### Componentes y diseño

- Inspeccionar y reutilizar layout, AppHeader, Sidebar, PriorityBadge y las vistas existentes de `front-vistas`.
- Definir tokens visuales y una sola familia de botones, campos, tablas, badges, tarjetas, diálogos y estados. Mantener la apariencia exacta de los mockups.
- Implementar navegación real y separación de layout público/autenticado. Registrar rutas de otros módulos coordinadamente; no implementar sus páginas.
- Compartir componentes con contratos simples y ejemplos para Roberto/Jasmine. Evitar componentes monolíticos o nombres de negocio incrustados en todos los controles.
- Entregar los componentes compartidos pronto, sin esperar a terminar las siete pantallas.

### Ticket y portal

- Implementar creación, consulta autorizada y listado con filtros/paginación en NestJS y PostgreSQL.
- Vincular titular desde la sesión, sin aceptar otro titular arbitrario desde el formulario.
- Guardar descripción, servicio, curso/sección y evidencia opcional. Controlar formato/tamaño y servir adjuntos mediante autorización.
- Evitar tickets duplicados al repetir un envío o reintentar después de una interrupción.
- Conectar P02–P05 con datos del servidor. No mezclar casos de otros usuarios en el dashboard personal.
- P04 distingue registrado, clasificación pendiente y revisión manual. No mostrar éxito de clasificación antes de que ocurra.
- Recibir identidad/permisos de Jasmine y contexto académico de Roberto; desarrollar dominio/pruebas con contratos cuando una dependencia aún no esté integrada.

### Resultado y aceptación

- [ ] Crear reporte, recibir código y verlo después en listado/detalle.
- [ ] Errores no borran los campos ya escritos; adjunto inválido se puede corregir.
- [ ] Otro usuario no consulta el caso/adjunto alterando un identificador.
- [ ] Reiniciar no pierde tickets y no crea copias.
- [ ] P02–P05 coinciden visualmente con sus referencias.
- [ ] Componentes compartidos están publicados para los otros módulos.

**Demostración:** con acceso de Jasmine integrado, Johan crea un reporte, actualiza la página y lo encuentra en su listado.

## Semana 2 — Prioridad, cola y resolución completa

Continuar `gestion-incidencias` si no terminó; no crear otra rama para el mismo trabajo solo porque cambió la semana.

### Backend y seguimiento

- Implementar clasificación manual por TI, asignación, detalle, historial, ajustes y resolución.
- Mantener una única implementación de prioridad. Consumir factor y eventos de Roberto, no inferir eventos reales solo por palabras del reporte.
- Probar T1=12/P1, T2=9/P1, T3=6/P2 y T4=2/P4. El ejemplo del laboratorio no tiene evaluación; corregir la descripción contradictoria del mock original.
- Crear modos llegada (fecha ascendente), técnico (urgencia×impacto) y contextual (puntaje). Para empates, fecha de creación y luego identificador. Comparar técnico frente a contextual para demostrar el cambio T2→T1.
- Excluir resueltos de la cola de abiertos. Pendientes de clasificación/contexto van a revisión visible; no se esconden con P4 inventado.
- Registrar primera atención humana, plazos y resolución. Mantener auditoría y motivo de cambios; no reiniciar reloj para mejorar cifras.
- El ajuste modifica urgencia/impacto con motivo; el factor es calculado por calendario, no editable como escala técnica.
- Actualizar seguimiento mediante eventos autorizados; al reconectar consultar estado real.
- Publicar a Jasmine una consulta autorizada de ticket con titular, servicio, actividad, instantes, estado y falla confirmada. No duplicar la emisión de constancias en tickets.

### Pantallas

P06 muestra información y progreso sin exponer puntaje técnico al estudiante. P07 muestra operaciones y datos del equipo autorizado. P08 permite revisar antecedentes, ajustar, atender, describir solución y confirmar falla de forma explícita. La resolución no siempre implica confirmación de una falla tecnológica.

### Aceptación

- [ ] Puntajes, límites de prioridad y SLA funcionan en casos frontera.
- [ ] Se demuestran tres ordenamientos sin falsear el orden por llegada.
- [ ] Asignación y resolución aparecen en el seguimiento del titular.
- [ ] Ajustes sin motivo se rechazan; cambios simultáneos no sobrescriben silenciosamente una resolución.
- [ ] Identificador de ruta selecciona el ticket correcto; nunca siempre el primer mock.
- [ ] Jasmine puede emitir constancia de un caso elegible usando tu contrato.
- [ ] P06–P08 y datos repetidos entre pantallas son coherentes.

**Demostración conjunta:** reportar→clasificar manualmente→priorizar→atender→resolver→solicitar constancia en el módulo de Jasmine.

## Semana 3 — IA clasificadora real

**Rama:** `clasificacion-ia`, después de integrar incidencias.

### Punto de consulta obligatorio

Solicitar a Roberto la elección del proveedor con opción gratuita y sus condiciones vigentes. No asumir Gemini, Grok u otro, ni contratar servicios. Si falta la decisión, avanzar con pruebas del contrato y revisión manual de la misma semana, sin presentar una simulación como integración real.

### Implementación

- Crear adaptador intercambiable que reciba texto necesario y devuelva categoría válida, urgencia 1–3, impacto 1–3 y explicación.
- Validar categorías y escala en NestJS; no permitir que el proveedor cambie usuario, permisos, plazos o resolución.
- Guardar el reporte antes de clasificar; gestionar cuota, red, formato inválido y límite de espera de 3 segundos con derivación manual.
- No enviar identificadores personales o adjuntos por defecto. Configurar clave solo en servidor y no registrarla en logs.
- Registrar proveedor/modelo, versión del adaptador y resultado útil para evaluación.
- Usar versión/estado de revisión del ticket para descartar respuestas tardías que sobrescribirían una corrección de TI.
- Conectar estados y mensajes reales a P04/P07/P08. No garantizar tres segundos de éxito de un servicio externo; garantizar la salida a revisión cuando exceda el presupuesto.

### Aceptación

- [ ] Clasificación real con clave configurada y proveedor elegido.
- [ ] Sin clave, cuota o proveedor, el ticket sigue existiendo y TI puede atenderlo.
- [ ] Respuesta fuera de escala se rechaza; respuesta tardía no pisa ajuste humano.
- [ ] Ninguna credencial aparece en frontend o logs.
- [ ] Evaluación con reportes etiquetados independientes de los ejemplos del prompt, mostrando precisión medida, no la meta 85 % como hecho.
- [ ] Los estados de proceso/error conservan el diseño de las pantallas.

## Semana 4 — Correcciones y entrega de incidencias

**Rama:** `correcciones-incidencias`, después de integrar la anterior.

1. Ejecutar CU01 completo con varios usuarios y con clasificación real/manual.
2. Probar cortes y reconexiones, reintentos de envío, rutas desconocidas, filtros vacíos y archivos inválidos.
3. Revisar formularios, foco visible, etiquetas, teclado, contraste y mensajes de error.
4. Comparar capturas de las siete pantallas a 1440 × 900 y adaptación a 390 × 844. Mantener estructura visual; no rediseñar en esta etapa.
5. Verificar que una corrección de componente no rompa calendarios, constancias o administración de compañeros.
6. Aportar resultados de pruebas de prioridad/SLA, precisión clasificadora y guion de demostración; no presentar una reducción de alertas o un valor de mockup como mejora experimental.

**Cierre:** CU01 completo, componentes compartidos estables, datos y permisos reales y dependencias entregadas a Jasmine/Roberto. No desarrollar reportes, notificaciones o PDF alternativos para compensar una conexión pendiente.

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
Pruebas ejecutadas y resultado:
Capturas comparadas con cada mockup:
Cómo reproducir la demostración:
Problemas conocidos y solicitudes a compañeros:
Condiciones necesarias para la siguiente semana:
```

No marcar un módulo terminado porque se ve bien si aún usa respuestas ficticias. No marcarlo fiel al diseño porque funciona si su apariencia difiere de los mockups.

**Detenerse después de entregar el avance.** No iniciar automáticamente la siguiente semana ni resolver módulos de otro integrante para eludir una dependencia. Si el integrante no indicó semana, empezar por revisar precondiciones y Semana 1. Puede continuarse con pruebas, documentación o tareas independientes de esa misma semana mientras se solicita un contrato pendiente.

La cuarta semana debe terminar con los tres casos integrados y las 24 pantallas funcionales. La disponibilidad 99,5 %, los 500 usuarios simultáneos y las metas académicas se evalúan y se reportan; no se afirman por instalar Docker ni se presentan como alcanzadas si las mediciones no lo respaldan.

