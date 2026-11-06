---
responsable: Roberto
revision: 2026-11-06
estado: plan_de_implementacion_no_ejecutado
pantallas_asignadas: [P13, P14, P16, P17, P18, P19, P24]
---

# Plan de implementación de CampusITSM para Roberto

Este plan está dirigido exclusivamente a Roberto y su agente. Tu trabajo incluye frontend y backend de tus módulos, más coordinación del equipo. Empieza por la entrega previa de Docker y no implementes las cuatro semanas en una sola ejecución.

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
| P13 Dashboard de demanda | Histórico, pronóstico, rango cuando esté disponible, capacidad y alertas con fuente/periodo | Lámina 4, arriba izquierda |
| P14 Detalle de alerta predictiva | Demanda frente a capacidad, causa, recomendaciones y revisión humana | Lámina 4, arriba derecha |
| P16 Evaluación del modelo | Modelos, ventana de datos, comparación, métricas y estado de evaluación | Lámina 4, abajo derecha |
| P17 Calendario académico | Semana, filtros, eventos y detalle con alcance correcto | Lámina 5, arriba izquierda |
| P18 Crear o importar evento | Formulario, CSV, vista previa, validación y guardado | Lámina 5, arriba derecha |
| P19 Factores y SLA | Configuración validada, motivo de cambio, versión e historial | Lámina 5, abajo izquierda |
| P24 Centro de notificaciones | Listado autorizado, filtros, lectura y acceso al objeto del aviso | Lámina 6, abajo derecha |

### Lámina 4 — P13, P14 y P16

Archivo final: `04_cu03_predicciones_alertas.png`. P15 pertenece a Jasmine; no implementarlo como una segunda página propia.

![Mockups de predicciones y alertas: Roberto implementa P13, P14 y P16](../diseno/campusitsm/04_cu03_predicciones_alertas.png)

### Lámina 5 — P17, P18 y P19

Archivo final: `05_cu03_calendario_configuracion.png`. P20 pertenece a Jasmine.

![Mockups de calendario y configuración: Roberto implementa P17, P18 y P19](../diseno/campusitsm/05_cu03_calendario_configuracion.png)

### Lámina 6 — P24

Archivo final: `06_cu03_permisos_privacidad_auditoria_v2.png`. P21, P22 y P23 pertenecen a Jasmine.

![Mockups de administración: Roberto implementa únicamente P24](../diseno/campusitsm/06_cu03_permisos_privacidad_auditoria_v2.png)

## Entrega previa obligatoria — Docker y base para los compañeros

Esta entrega ocurre al principio de Semana 1 y desbloquea el trabajo conectado. No esperar a terminar calendario o predicciones para publicarla.

1. Revisar el estado real de Git y recuperar el contenido de `front-vistas` sin perder diseños o cambios locales. No iniciar de nuevo el proyecto ignorando las vistas existentes.
2. Preparar una organización compartida: `apps/web`, `apps/api`, `services/predictions`, manteniendo `diseno/` y `planes/`. Publicar rutas definitivas en el contexto para que nadie cree otras.
3. Mantener React/Vite y crear el esqueleto modular de NestJS y el servicio Python interno. El esqueleto no equivale a implementar los módulos de Johan/Jasmine.
4. Preparar Docker Compose, Dockerfiles, versiones compatibles fijadas, configuración de ejemplo y volúmenes. El frontend es el punto de entrada; API y Python se comunican por red interna. Proporcionar perfil de desarrollo y construcción de entrega.
5. Añadir PostgreSQL, migraciones iniciales, restricciones básicas y semilla reproducible sin credenciales reales. Los datos de demostración no deben reiniciarse en cada arranque ni sobrescribir una base con trabajo.
6. Preparar salud del frontend/API/base/Python y tarea explícita de migración antes de abrir la API. El comando documentado de arranque es `docker compose up --build`.
7. Coordinar el modelo de identidad con Jasmine y el de tickets con Johan. Publicar primero los contratos y entidades necesarios; no imponerles servicios incompletos ocultos tras datos de ejemplo.
8. Actualizar `PROYECTO.md` al stack/equipo actual y crear contratos y estado del equipo. Publicar los mockups finales: no asumir que existen en GitHub porque están en tu carpeta.
9. Verificar construcción desde un clon/copia limpia del repositorio compartido, salud y persistencia tras apagar y volver a levantar sin borrar volúmenes.
10. Integrar/publicar en `main`, registrar el commit exacto y avisar al equipo por el canal que ustedes utilicen. El agente no envía mensajes externos por su cuenta.

**Condición de entrega:** Johan y Jasmine pueden obtener ese commit, configurar su entorno local y construir los mismos contenedores en su Docker. Sus bases y archivos son locales e independientes; no se conectan a tu computadora. Publicar instrucciones de acceso desde otro dispositivo solo si se va a demostrar QR por red local.

La rama fuente `front-vistas` solo se retira después de preservar e integrar todo su contenido y confirmar que no pertenece a trabajo activo de un compañero. Eliminar ramas de módulos creadas por el equipo no autoriza a eliminar trabajo desconocido.

## Semana 1 — Base publicada y calendario manual

**Ramas, en secuencia:** `base-proyecto` y, una vez integrada, `calendario-academico`.

### Trabajo de frontend y backend

- Entregar primero la base anterior y reservar tiempo para revisar dependencias de compañeros.
- Crear cursos, secciones, asociaciones de usuarios y eventos con tipo, inicio/fin, alcance y fuente.
- Implementar CRUD autorizado, consulta de eventos aplicables y campos para P17/P18.
- Conectar P17 y formulario manual P18 usando componentes de Johan. Si todavía se negocia el componente compartido, desarrollar el dominio y pruebas; no producir otra familia de controles.
- Mostrar calendario personal limitado cuando el portal lo consulte; la pantalla administrativa mantiene permisos de administrador.
- Guardar motivo/origen de cambios para auditoría de Jasmine.

### Recibir y proporcionar

Recibir de Jasmine identidad/permisos y contrato de auditoría; de Johan, componentes y necesidades de consulta del contexto. Proporcionar contexto por usuario/curso/fecha, semilla coherente y contratos versionados. Las asociaciones no se deducen del texto libre de un ticket.

### Aceptación y demostración

- [ ] Docker y base publicados antes de pedir conexiones a compañeros.
- [ ] Evento se guarda y persiste; usuario de otra sección no recibe ese contexto.
- [ ] Fecha fin anterior al inicio se rechaza y muestra error de campo.
- [ ] P17/P18 reproducen los cuadrantes asignados.
- [ ] Demostrar calendario y, con los módulos integrados de compañeros, acceso y registro persistente.
- [ ] Registrar commit de base, comprobaciones, pendientes y solicitud de contratos no disponibles.

La rama de calendario puede continuar en Semana 2 si ese módulo no está terminado; no borrarla a mitad del trabajo.

## Semana 2 — CSV, configuración y preparación analítica

### Trabajo

- Completar P18 con CSV: formato documentado, vista previa, errores por fila, detección de duplicados y confirmación. Validar todo antes de publicar; una importación inválida no modifica datos parcialmente.
- Completar P19. Validar escalas y rangos, registrar versión, vigencia y motivo. Notificar a Johan los cambios que afectan tickets abiertos; evitar restablecer plazos como si fueran reportes nuevos.
- Exponer a prioridad el factor académico y motivo con los eventos que lo justifican. Distinguir calendario consultado sin eventos de calendario no disponible.
- Preparar histórico sintético de 24 meses y aproximadamente 43000 tickets con generador reproducible, incluidos calendario y variaciones de demanda. Separarlo del historial operativo para que no infle las métricas actuales.
- Publicar contrato de series observadas, pronóstico, evaluaciones y reportes para P15 de Jasmine: periodo, unidad, fuente, modelo, fecha de generación y estado disponible/no disponible.
- Preparar trabajos persistentes, artefactos de modelos en volumen, API interna Python y prueba de referencia semanal. No exponer Python directamente al navegador.

### Aceptación

- [ ] Importación válida guarda una vez; inválida no publica filas incompletas.
- [ ] Los factores respetan curso, sección, fechas y máximo aplicable.
- [ ] Los SLA coinciden con los acordados; P1 no aparece con 30 min.
- [ ] Las configuraciones se leen desde un servicio único.
- [ ] El dataset se identifica como sintético y puede regenerarse.
- [ ] P19 y P18 completos se comparan visualmente con sus referencias.
- [ ] Jasmine recibe el contrato analítico antes de desarrollar P15; Johan puede resolver el ejemplo académico sin hardcodear eventos.

**Demostración conjunta de semana:** CU01 manual y CU02 funcionando, con tu calendario/configuración integrados.

## Semana 3 — Pronóstico, evaluación, alertas y P24

**Ramas:** cerrar calendario; después `prediccion-demanda` y `alertas-notificaciones`, integrando cada módulo antes del dependiente.

### Trabajo

- Agregar tickets por fecha de registro, no únicamente resueltos. Distinguir días observados con cero de fechas sin datos.
- Comparar referencia semanal con candidato SARIMAX estacional semanal y variables académicas conocidas al emitir el pronóstico. Registrar parámetros, semilla, ventana y versión.
- Evaluar mediante cortes temporales anteriores a periodos de prueba, con horizonte 14 días. Comparar MAE sobre los mismos periodos; MAPE excluye valores reales cero y muestra el número excluido.
- Conservar referencia como opción válida si supera al candidato; no elegir el modelo más complejo por nombre. Sin datos suficientes, exponer estado no disponible.
- Emitir pronóstico diario de 14 días, guardar valores y rango del modelo cuando exista; no fabricar intervalos para la referencia. Agregar a semana con unidades consistentes.
- Programar 6:00 diario y evaluación de reentrenamiento domingo 2:00 en America/Lima; recuperar tareas omitidas después de reinicio sin duplicar corridas. Mantener la última versión válida si una nueva falla.
- Conectar P13, P14 y P16 a resultados guardados, no a ejemplos del mockup. Proporcionar a Jasmine los resultados para P15.
- Configurar capacidad en tickets/semana. Una alerta por semana objetivo se actualiza sin repetir avisos diarios; revisión humana no cambia turnos automáticamente.
- Implementar servicio común de notificaciones y P24: destinatario autorizado, clasificación por tipo, lectura, enlaces y no exposición entre usuarios.
- Avisar al 80 % del plazo de primera respuesta y al vencerlo, sin repetir el mismo aviso. Confirmar con Johan instantes reales de atención.
- Recibir eventos de asignación/resolución/constancia de los otros módulos y conservarlos de forma recuperable.

### Aceptación

- [ ] Un pronóstico tiene trazabilidad a datos, modelo, métricas y fecha.
- [ ] Rango/periodo/unidad y origen aparecen claramente; no se presenta una medición ficticia como eficacia real.
- [ ] Una semana prevista por encima de capacidad genera una alerta revisable; repetir tarea no genera copias.
- [ ] Fallar Python conserva el último modelo/resultados válidos y muestra su fecha; no simula una corrida nueva.
- [ ] P24 muestra solo avisos del destinatario autorizado.
- [ ] Las cuatro pantallas nuevas corresponden a los mockups propios.

## Semana 4 — Integración y operación comprobable

**Rama:** `integracion-final`, después de integrar los módulos anteriores.

1. Revisar las entregas y ramas de compañeros; integrar dependencias antes de consumidores.
2. Ejecutar CU01, CU02 y CU03 sobre `main`, con usuarios distintos.
3. Probar reinicio durante tareas, duplicación de solicitudes, pérdida temporal de Python y reconexión de actualizaciones.
4. Respaldar y restaurar PostgreSQL, archivos emitidos/adjuntos y artefactos de modelos. Verificar correspondencia de versiones y permisos.
5. Probar 500 usuarios concurrentes sobre escenario documentado y registrar latencia/errores/recursos; informar límites del equipo, sin prometer 99,5 % por la prueba local.
6. Coordinar la revisión de las 24 pantallas; corregir tus siete y las conexiones de infraestructura.
7. Preparar guía de instalación, variables, migraciones, arranque, restauración y guion de demostración.
8. Registrar resultados reales de clasificación/prioridad/predicción/constancias sin convertir metas del Word en resultados logrados.

**Cierre:** base reproducible, tres recorridos integrados, documentación y pendientes claramente identificados. No iniciar conexión institucional, correo ni firma certificada para completar una imagen.

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

