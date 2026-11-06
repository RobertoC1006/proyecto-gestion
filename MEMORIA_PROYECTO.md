# Memoria de CampusITSM

Actualizada el 6 de noviembre de 2026 por solicitud expresa de Roberto. Este archivo conserva acuerdos y puntos de reanudación; el código y las ramas deben revisarse de nuevo antes de implementar.

## Proyecto y fuentes de trabajo

- Carpeta: `C:\Users\ROBERTO CARLOS\Documents\GitHub\proyecto-gestion`.
- Repositorio: `https://github.com/RobertoC1006/proyecto-gestion.git`.
- CampusITSM es la mesa de ayuda universitaria del caso académico de la Universidad Privada Tallán, institución ficticia. No es el proyecto Soluciona TI del minimarket ni VEXOR.
- El documento académico de origen está en `C:\Users\ROBERTO CARLOS\Downloads\Proyecto Final Gestion del Servicio TI.docx`. No contiene por sí solo todas las decisiones actuales; los acuerdos posteriores recogidos aquí y en los planes actualizan el alcance.
- Los tres planes son independientes: [Roberto](planes/PLAN_ROBERTO.md), [Johan](planes/PLAN_JOHAN.md) y [Jasmine](planes/PLAN_JASMINE.md). Cada uno contiene contexto, stack, tareas semanales, dependencias, pruebas, mockups y reglas de Git. No volver a solicitar los archivos al usuario si siguen disponibles en la carpeta.
- [Casos de uso y catálogo de pantallas](diseno/campusitsm/CASOS_DE_USO_Y_PANTALLAS.md). Los detalles marcados como pendientes en ese documento inicial pueden haber quedado resueltos por los planes y esta memoria.

## Estado real al cerrar este chat

- Se realizó revisión del repositorio, análisis del Word, definición de flujos, generación de 24 pantallas en seis láminas y redacción de tres planes.
- No se ha empezado a implementar Docker, NestJS, PostgreSQL conectado ni IA real. Guardar memoria no autoriza a iniciar ahora el desarrollo.
- Rama local seleccionada: `main`, commit `1501f5aaec13a77f3ebb79da52bf50d66e4e6678`; su contenido publicado solo tiene README.
- `origin/front-vistas`, commit `a4896261f92507155f5f153f7476fd29d99d631b`, contiene el frontend React/Vite/TypeScript, vistas mayormente estáticas, componentes y datos ficticios. Sus dos commits adicionales son documentación y vistas.
- Los diseños, planes y archivos de contexto preparados en este chat permanecen locales y sin integrar/publicar. No asumir que Johan y Jasmine ya los reciben al clonar GitHub. No confundir estos archivos con una base Docker entregada.
- `PROYECTO.md` está en la rama de frontend, no inicialmente en `main`; todavía menciona Next.js y seis integrantes. Se debe actualizar al acuerdo vigente durante la base inicial.
- Verificar ramas, estado y cambios ajenos antes de trabajar; esta fotografía no es prueba del estado futuro.

## Acuerdos de producto y arquitectura

Tres casos de uso amplios: CU01 registrar/priorizar/atender incidencias; CU02 emitir y verificar constancias; CU03 anticipar demanda y administrar operación, permisos y datos.

Stack decidido por Roberto: React con Vite y TypeScript, NestJS, PostgreSQL con Prisma, Docker Compose. Se aceptó un contenedor auxiliar Python para entrenamiento y predicción. Una sola API modular, una base por instalación, contratos OpenAPI; React Router, TanStack Query, Recharts y Lucide. Tareas persistentes con pg-boss sobre PostgreSQL.

Primera versión local completa: cuentas propias, calendario manual/CSV, una institución/equipo, constancias PDF reales verificables y notificaciones internas. Quedan fuera por ahora conexión institucional externa, correo, firma digital certificada, multiinstitución y despliegue público.

La IA clasificadora interpreta el texto y propone categoría y valores técnicos. El pronóstico de demanda es otro modelo, ejecutado en Python. **Preguntar a Roberto cuando llegue el módulo de IA para elegir un proveedor con opción gratuita vigente; no elegirlo ni contratarlo de antemano.** Consideró Gemini, Grok u otros como posibilidades, sin escoger uno.

Las constancias requieren ticket resuelto y falla confirmada. Deben tener PDF/QR reales, consulta pública mínima con nombre enmascarado y comprobación de alteraciones del archivo; identidad visible de prototipo, sin afirmar firma certificada. Una consulta de código no comprueba por sí sola que un PDF arbitrario esté intacto.

Regla de prioridad: urgencia (1–3) × impacto técnico (1–3) × factor académico. Factores regular 1; entrega futura <48 h: 1,5; matrícula en curso: 1,7; examen en curso o <24 h: 2. Aplicar el mayor que corresponda al usuario/curso. P1 ≥9; P2 ≥5 y <9; P3 ≥3 y <5; P4 <3. Respuesta/resolución: P1 15 min/2 h, P2 1 h/4 h, P3 4 h/24 h, P4 8 h/72 h. No usar el valor estático erróneo de 30 min para P1. Comparar orden técnico y contextual para demostrar T2→T1, sin falsear el orden por llegada.

Predicción: historial sintético reproducible y claramente separado, 24 meses; objetivo tickets diarios, horizonte 14 días. Comparar referencia semanal con candidato SARIMAX, evaluar temporalmente y mostrar métricas calculadas. Alerta al superar capacidad semanal configurada. No convertir las cifras de mockups o metas del Word en resultados logrados. El pronóstico no cambia automáticamente prioridades individuales.

## Equipo y ritmo de cuatro semanas

Roberto, Johan y Jasmine trabajan por **módulos completos: frontend, backend y pruebas**. Roberto no desarrolla todo el backend. Dedicación prevista: 11–20 horas por persona/semana. Semanas relativas, todavía sin fecha de inicio fijada.

| Persona | Responsabilidades | Pantallas |
| --- | --- | --- |
| Roberto | Base Docker, esquema/migraciones y coordinación; calendario/configuración; predicciones, alertas y notificaciones | P13, P14, P16, P17, P18, P19, P24 |
| Johan | Componentes compartidos; incidencias, prioridad, seguimiento, atención y clasificación IA | P02–P08 |
| Jasmine | Acceso, usuarios, permisos, consentimiento, constancias, privacidad, auditoría y reportes | P01, P09–P12, P15, P20–P23 |

1. Semana 1: Roberto publica primero infraestructura/contexto/contratos mínimos; después calendario manual. Johan hace componentes y registro/listado. Jasmine hace acceso/permisos y usuarios básicos.
2. Semana 2: calendario CSV/configuración; atención y prioridad manual completas; constancias verificables.
3. Semana 3: elección e integración de IA, predicciones/alertas y administración/reportes restantes.
4. Semana 4: integración, fidelidad visual, permisos, fallos, persistencia, respaldo/restauración, carga, manuales y demostración.

**Avanzar solo la semana indicada.** Si el usuario no señala otra, el punto de reanudación es la preparación previa y Semana 1 de Roberto. No implementar las cuatro semanas de golpe ni pasar automáticamente a la siguiente tras una entrega.

## Docker primero y colaboración

Roberto debe recuperar el frontend y preservar los documentos, preparar estructura, Docker Compose, salud, volúmenes, configuración sin secretos, migraciones y contratos. Publicará la base mínima en `main` y registrará el commit utilizable antes de exigir trabajo conectado a Johan/Jasmine. Ellos construirán los mismos contenedores en su propio Docker con bases/volúmenes locales; no necesitan conectarse a la computadora de Roberto.

Durante esa entrega se crearán/actualizarán `PROYECTO.md`, `docs/CONTRATOS.md` y `docs/ESTADO_EQUIPO.md`. Hoy no están entregados como base funcional. No inventar otra aplicación o infraestructura por falta temporal de contratos.

Antes de cada avance: revisar cambios sin confirmar, referencias remotas, diferencias con `main`, ramas activas de compañeros, contratos y dependencias. Inspeccionar una rama ajena no autoriza a modificarla, fusionarla o borrarla. No descartar cambios para sincronizarse. Si no hay red, declarar que el estado remoto no fue verificado.

## Ramas y reutilización

- Una rama nueva por módulo con nombre normal, **sin `codex/` ni prefijos similares**, por instrucción expresa del usuario. No cambiar identidad de Git para aparentar otra autoría.
- Puede haber hasta tres ramas activas, una por persona. Cada módulo se integra verificado en `main`; después se borra su rama local y de GitHub. No borrar trabajo sin integrar ni ramas activas ajenas; no usar borrado forzado como limpieza.
- Un módulo puede durar más de una semana. Las ramas previstas de Roberto son `base-proyecto`, `calendario-academico`, `prediccion-demanda`, `alertas-notificaciones`, `integracion-final`. Las de compañeros se detallan en sus planes.
- Reutilizar los componentes existentes y una sola familia compartida de controles, tablas, estados y layouts. No duplicar catálogos, lógica, servicios o esquemas para avanzar en paralelo.
- Roberto coordina esquema/migraciones/configuración/contratos; Johan componentes/navegación/prioridad; Jasmine identidad/autorización/auditoría. Cambios compartidos se coordinan con su responsable.
- Las reglas de negocio y autorización viven en NestJS; React muestra resultados. No almacenar datos de negocio en localStorage. No duplicar cálculo de prioridad en Python.

## Mockups finales que ya están disponibles

Las pantallas deben reproducir los mockups generados, no reinterpretarlos: distribución, componentes, paleta verde/menta, gráficos, tamaños relativos y espaciados. Reemplazar datos ilustrativos por reales y corregir errores de texto sin rediseñar. Comparar capturas implementadas con cada cuadrante; cada entrega tiene aceptación funcional y visual.

| Lámina final en `diseno/campusitsm/` | Pantallas y responsables |
| --- | --- |
| `01_cu01_ingreso_reporte_v2.png` | P01 Jasmine; P02–P04 Johan |
| `02_cu01_seguimiento_atencion_v2.png` | P05–P08 Johan |
| `03_cu02_constancias.png` | P09–P12 Jasmine |
| `04_cu03_predicciones_alertas.png` | P13, P14, P16 Roberto; P15 Jasmine |
| `05_cu03_calendario_configuracion.png` | P17–P19 Roberto; P20 Jasmine |
| `06_cu03_permisos_privacidad_auditoria_v2.png` | P21–P23 Jasmine; P24 Roberto |

Cada lámina tiene cuatro vistas en orden arriba izquierda, arriba derecha, abajo izquierda, abajo derecha. Usar las versiones `_v2` indicadas, no bocetos anteriores. Los planes tienen enlaces relativos e imágenes incorporadas y especifican cada posición.

Paquetes independientes para compartir con agentes: `C:\Users\ROBERTO CARLOS\.codex\visualizations\2026\11\06\01a1b1fa-27da-7331-b96e-56b6c923d4c6\planes_para_compartir\PAQUETE_ROBERTO.zip`, y equivalentes `PAQUETE_JOHAN.zip` y `PAQUETE_JASMINE.zip`. Incluyen su plan y sus referencias. Si cambia un plan, regenerar su paquete para que coincida.

## Punto de reanudación en otro chat

Abrir esta misma carpeta. Leer esta memoria y `planes/PLAN_ROBERTO.md`, comprobar Git y los archivos reales y comenzar únicamente la entrega previa de Docker/Semana 1 cuando Roberto solicite programar. Los planes y mockups ya existen; no pedir que se vuelvan a subir. El siguiente chat debe distinguir crear la base de desarrollar los módulos de los compañeros.
