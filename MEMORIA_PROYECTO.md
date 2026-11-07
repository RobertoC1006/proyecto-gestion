# Memoria de CampusITSM

Actualizada el 7 de noviembre de 2026 tras la transición a Supabase solicitada por Roberto; invitaciones aplazadas hasta recibir correos. Este archivo conserva acuerdos y puntos de reanudación; el código y las ramas deben revisarse de nuevo antes de implementar.

## Proyecto y fuentes de trabajo

- Carpeta: `C:\Users\ROBERTO CARLOS\Documents\GitHub\proyecto-gestion`.
- Repositorio: `https://github.com/RobertoC1006/proyecto-gestion.git`.
- CampusITSM es la mesa de ayuda universitaria del caso académico de la Universidad Privada Tallán, institución ficticia. No es el proyecto Soluciona TI del minimarket ni VEXOR.
- El documento académico de origen está en `C:\Users\ROBERTO CARLOS\Downloads\Proyecto Final Gestion del Servicio TI.docx`. No contiene por sí solo todas las decisiones actuales; los acuerdos posteriores recogidos aquí y en los planes actualizan el alcance.
- Los tres planes son independientes: [Roberto](planes/PLAN_ROBERTO.md), [Johan](planes/PLAN_JOHAN.md) y [Jasmine](planes/PLAN_JASMINE.md). Cada uno contiene contexto, stack, tareas semanales, dependencias, pruebas, mockups y reglas de Git. No volver a solicitar los archivos al usuario si siguen disponibles en la carpeta.
- [Casos de uso y catálogo de pantallas](diseno/campusitsm/CASOS_DE_USO_Y_PANTALLAS.md). Los detalles marcados como pendientes en ese documento inicial pueden haber quedado resueltos por los planes y esta memoria.

## Estado vigente y decisiones expresas

- Base Docker publicada mediante PR #1, main `196a2144aae253ca672eeeaf721c62204516245a`: web, NestJS, PostgreSQL/Prisma, Python interno, salud, migraciones y volúmenes verificados. La historia de `front-vistas@a4896261f92507155f5f153f7476fd29d99d631b` quedó preservada al mover el frontend a `apps/web`.
- Calendario manual y pantallas P17/P18 integrados mediante [PR #2](https://github.com/RobertoC1006/proyecto-gestion/pull/2), main `f519466850d28f2ab28d2b69cfc4146c60149717`. Código visual aprobado: `047d1a2e0fd4f71bb189ff301cacb6e1f21019cf`. Verificar el commit actual antes de consumirlo.
- La base visual usa componentes reales de `RobertoC1006/casos-gestion`, adaptados a las pantallas del mockup. Guía vigente: `docs/DISENO_COMPONENTES.md`. Las demás vistas provisionales aún necesitan adaptación por sus responsables.
- Roberto asume P01, Supabase Auth y la base de roles/permisos. Jasmine conserva administración de usuarios/permisos sobre esa base, consentimiento, auditoría, constancias y reportes. Ver `docs/CONTRATO_IDENTIDAD.md`.
- Supabase Auth alojado implementado/configurado en la rama local `identidad-supabase`, commit `8b02d6f`, sin integrar/publicar en main al revisar GitHub. Roberto completó registro, confirmación, login y acceso al formulario académico como administrador, tras autorizar esa asignación. No crear otro login ni accesos ficticios. Ver `docs/CONTRATO_IDENTIDAD.md`.
- Roberto decidió una misma base de desarrollo PostgreSQL en Supabase para los tres backend, cada uno ejecutado en su propio Docker, y acceso de colaboradores para Johan/Jasmine. El traslado de estructura/datos y la conexión de Roberto se ejecutaron y verificaron en base-compartida-supabase. Docker normal no inicia db ni migrate; se usan credenciales separadas y sesiones por instalación. PostgreSQL local está detenido con su volumen intacto. Cifrado obligatorio de Supabase activado y verificado desde la conexión de API tras el reinicio. Los dos respaldos privados se restauraron y las 12 tablas se compararon por conteo/contenido. Colaboradores/configuración de Johan y Jasmine pendientes; Roberto permitió aplazarlos hasta tener correos. Ver docs/OPERACION_SUPABASE.md. El código aún no está integrado/publicado en main. Ver [coordinación](docs/COORDINACION_SUPABASE.md).
- No hay tickets, constancias, IA ni pronósticos reales implementados. CSV y factores/SLA siguen siendo semana 2.
- Los tres planes se sincronizan con esta entrega. Regenerar sus ZIP al modificarlos. Verificar siempre Git, ramas ajenas y `docs/ESTADO_EQUIPO.md`; esta memoria no prueba el estado remoto futuro.

## Acuerdos de producto y arquitectura

Tres casos de uso amplios: CU01 registrar/priorizar/atender incidencias; CU02 emitir y verificar constancias; CU03 anticipar demanda y administrar operación, permisos y datos.

Stack decidido por Roberto: React con Vite y TypeScript, NestJS, PostgreSQL con Prisma, Docker Compose. Se aceptó un contenedor auxiliar Python para entrenamiento y predicción. Una sola API modular y un único esquema/migraciones Prisma. Destino acordado: una misma base de desarrollo en Supabase para el equipo; PostgreSQL local para pruebas aisladas. Contratos OpenAPI; React Router, TanStack Query, Phosphor y DM Sans/Manrope. Recharts y pg-boss se incorporarán al implementar sus módulos.

Primera versión acordada: frontend/backend y Python en Docker, base de negocio compartida en Supabase, ya conectada para Roberto, Supabase Auth alojado, calendario manual/CSV, una institución/equipo, constancias PDF reales verificables y notificaciones internas. Roberto eligió registro propio y recuperación por enlace; SMTP para confirmaciones externas pendiente. Quedan fuera conexión institucional externa, correo de notificaciones generales, firma digital certificada, multiinstitución y despliegue público de la aplicación. La base remota no comparte automáticamente los archivos/modelos de volúmenes locales.

La IA clasificadora interpreta el texto y propone categoría y valores técnicos. El pronóstico de demanda es otro modelo, ejecutado en Python. **Preguntar a Roberto cuando llegue el módulo de IA para elegir un proveedor con opción gratuita vigente; no elegirlo ni contratarlo de antemano.** Consideró Gemini, Grok u otros como posibilidades, sin escoger uno.

Las constancias requieren ticket resuelto y falla confirmada. Deben tener PDF/QR reales, consulta pública mínima con nombre enmascarado y comprobación de alteraciones del archivo; identidad visible de prototipo, sin afirmar firma certificada. Una consulta de código no comprueba por sí sola que un PDF arbitrario esté intacto.

Regla de prioridad: urgencia (1–3) × impacto técnico (1–3) × factor académico. Factores regular 1; entrega futura <48 h: 1,5; matrícula en curso: 1,7; examen en curso o <24 h: 2. Aplicar el mayor que corresponda al usuario/curso. P1 ≥9; P2 ≥5 y <9; P3 ≥3 y <5; P4 <3. Respuesta/resolución: P1 15 min/2 h, P2 1 h/4 h, P3 4 h/24 h, P4 8 h/72 h. No usar el valor estático erróneo de 30 min para P1. Comparar orden técnico y contextual para demostrar T2→T1, sin falsear el orden por llegada.

Predicción: historial sintético reproducible y claramente separado, 24 meses; objetivo tickets diarios, horizonte 14 días. Comparar referencia semanal con candidato SARIMAX, evaluar temporalmente y mostrar métricas calculadas. Alerta al superar capacidad semanal configurada. No convertir las cifras de mockups o metas del Word en resultados logrados. El pronóstico no cambia automáticamente prioridades individuales.

## Equipo y ritmo de cuatro semanas

Roberto, Johan y Jasmine trabajan por **módulos completos: frontend, backend y pruebas**. Roberto no desarrolla todo el backend. Dedicación prevista: 11–20 horas por persona/semana. Semanas relativas, todavía sin fecha de inicio fijada.

| Persona | Responsabilidades | Pantallas |
| --- | --- | --- |
| Roberto | Base Docker, esquema/migraciones y coordinación; P01, Supabase Auth y autorización común; calendario/configuración; predicciones, alertas y notificaciones | P01, P13, P14, P16, P17, P18, P19, P24 |
| Johan | Componentes compartidos; incidencias, prioridad, seguimiento, atención y clasificación IA | P02–P08 |
| Jasmine | Administración de usuarios/permisos sobre la base de Roberto; consentimiento, constancias, privacidad, auditoría y reportes | P09–P12, P15, P20–P23 |

1. Semana 1: base Docker/calendario entregados; identidad implementada en rama. La base común ya está trasladada/conectada para Roberto; entregar código autorizado y accesos de compañeros cuando corresponda. Johan reutiliza componentes para registro/listado; Jasmine prepara administración/consentimiento/auditoría con los contratos comunes. Revisar esta carga antes de comprometer plazos posteriores.
2. Semana 2: calendario CSV/configuración; atención y prioridad manual completas; constancias verificables.
3. Semana 3: elección e integración de IA, predicciones/alertas y administración/reportes restantes.
4. Semana 4: integración, fidelidad visual, permisos, fallos, persistencia, respaldo/restauración, carga, manuales y demostración.

**Avanzar solo la etapa indicada.** No recrear identidad por su estado anterior en main. La transición fue solicitada y ejecutada; las invitaciones siguen pendientes. Leer operación/estado antes de aplicar nuevos cambios. Esta entrega no inicia otras semanas.

## Docker primero y colaboración

Roberto ya recuperó el frontend, preservó su historia y publicó Docker Compose, salud, volúmenes, configuración sin secretos, migraciones y contratos. Cada persona conserva su Docker local y se conecta al mismo Supabase al recibir su configuración privada; no depende de la computadora de Roberto. La instalación de Roberto ya usa la base remota. Las claves de cifrado se generan por instalación; no compartirlas. Archivos/modelos siguen siendo locales.

Decisión expresa de Roberto: una sola instalación de trabajo `campusitsm` por computadora, en `http://localhost:8080`. Los avances se revisan reconstruyendo la misma instalación desde la rama activa, con sus volúmenes conservados. No crear otra aplicación Compose por módulo/revisión ni otro puerto para mostrarla. Esto no integra la rama en main: la integración sigue requiriendo su autorización. La instalación adicional `campusitsm-calendar-review` se cerró conservando sus volúmenes; no volver a levantarla para revisiones. Las pruebas automatizadas con datos descartables se mantienen aisladas de la base de trabajo y no dejan otra aplicación encendida.

`PROYECTO.md`, `docs/CONTRATOS.md`, `docs/ESTADO_EQUIPO.md` y `docs/COORDINACION_SUPABASE.md` registran la transición ejecutada y los accesos pendientes del equipo. El arranque normal no migra; usar el comando manual y la credencial migradora por separado. No inventar otra infraestructura o identidad por falta temporal de contratos.

Antes de cada avance: revisar cambios sin confirmar, referencias remotas, diferencias con `main`, ramas activas de compañeros, contratos y dependencias. Inspeccionar una rama ajena no autoriza a modificarla, fusionarla o borrarla. No descartar cambios para sincronizarse. Si no hay red, declarar que el estado remoto no fue verificado.

## Ramas y reutilización

- Una rama nueva por módulo con nombre normal, **sin `codex/` ni prefijos similares**, por instrucción expresa del usuario. No cambiar identidad de Git para aparentar otra autoría.
- Puede haber hasta tres ramas activas, una por persona. Cada módulo se integra verificado en `main`; después se borra su rama local y de GitHub. No borrar trabajo sin integrar ni ramas activas ajenas; no usar borrado forzado como limpieza.
- Un módulo puede durar más de una semana. `base-proyecto` ya se integró; `calendario-academico` corresponde a PR #2. Siguientes ramas previstas de Roberto: `identidad-supabase`, una rama de continuación de calendario al retomar CSV/configuración, `prediccion-demanda`, `alertas-notificaciones`, `integracion-final`. Las de compañeros se detallan en sus planes.
- Reutilizar los componentes existentes y una sola familia compartida de controles, tablas, estados y layouts. No duplicar catálogos, lógica, servicios o esquemas para avanzar en paralelo.
- Roberto coordina esquema/migraciones/configuración/contratos e identidad/autorización; Johan componentes/navegación/prioridad; Jasmine administración/consentimiento/auditoría. Cambios compartidos se coordinan con su responsable.
- Aclaración de Roberto: el acceso de colaboradores permite a cada integrante y su agente crear tablas, columnas e índices nuevos de su módulo dentro del plan, compatibles y validados, sin pedirle permiso por cada cambio una vez habilitado el entorno. Registrar/avisar y guardar la migración en Git; consultar previamente si afecta partes comunes, otro módulo o compatibilidad. No borrar tablas/datos existentes. Una migración ordinaria delegada puede aplicarse antes de fusionar todo el módulo. Una rama Git no aísla la base; conservar el historial exacto y compartir dependencias. Ver `docs/REGISTRO_CAMBIOS_BD.md`. Ver datos o tablas en Supabase no requiere reconstruir Docker; solo se actualiza la aplicación que vaya a consumir una función/modelo nuevo.
- Las reglas de negocio y autorización viven en NestJS; React muestra resultados. No almacenar datos de negocio en localStorage. No duplicar cálculo de prioridad en Python.

## Mockups finales que ya están disponibles

Los mockups siguen definiendo pantallas, estructura y funciones. Roberto pidió usar el diseño y componentes reales de casos-gestion y aprobó la adaptación del calendario: esa decisión actualiza el acabado visual anterior. Reutilizar la guía compartida, reemplazar datos ilustrativos por reales y comparar capturas de escritorio/móvil; cada entrega tiene aceptación funcional y visual.

| Lámina final en `diseno/campusitsm/` | Pantallas y responsables |
| --- | --- |
| `01_cu01_ingreso_reporte_v2.png` | P01 Roberto; P02–P04 Johan |
| `02_cu01_seguimiento_atencion_v2.png` | P05–P08 Johan |
| `03_cu02_constancias.png` | P09–P12 Jasmine |
| `04_cu03_predicciones_alertas.png` | P13, P14, P16 Roberto; P15 Jasmine |
| `05_cu03_calendario_configuracion.png` | P17–P19 Roberto; P20 Jasmine |
| `06_cu03_permisos_privacidad_auditoria_v2.png` | P21–P23 Jasmine; P24 Roberto |

Cada lámina tiene cuatro vistas en orden arriba izquierda, arriba derecha, abajo izquierda, abajo derecha. Usar las versiones `_v2` indicadas, no bocetos anteriores. Los planes tienen enlaces relativos e imágenes incorporadas y especifican cada posición.

Paquetes vigentes: `outputs/planes_para_compartir/PAQUETE_ROBERTO.zip` y equivalentes Johan/Jasmine; se generan con `python scripts/prepare-plan-packages.py`. Incluyen planes, coordinación Supabase, registro de cambios, contratos, guía visual y mockups, sin secretos ni dependencias. Los compañeros obtienen el código base autorizado por Roberto; un ZIP no prueba integración en main ni habilitación remota. Las copias compartidas del 6 de noviembre son históricas y no se actualizaron por esta edición. Si cambia un plan, regenerar sus paquetes.

## Punto de reanudación en otro chat

Abrir esta misma carpeta. Leer esta memoria, el plan personal, COORDINACION_SUPABASE y ESTADO_EQUIPO; comprobar Git y configuración real. Identidad y transición están implementadas en la rama local base-compartida-supabase, aún sin main. Roberto ya usa Supabase, con PostgreSQL local detenido y volumen intacto. Siguiente paso de coordinación: código autorizado/integración y accesos privados de compañeros cuando haya correos, con alcance revisado; SMTP externo pendiente. Leer OPERACION_SUPABASE. No repetir el traslado, recrear Docker/diseño/login ni aplicar migraciones por leer los planes. Los mockups ya existen. No desarrollar módulos ajenos ni avanzar de semana por esta coordinación documental.
