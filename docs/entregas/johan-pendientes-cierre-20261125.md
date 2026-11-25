# CampusITSM — especificaciones pendientes de Johan

Fecha: 25 de noviembre de 2026. Responsable: Johan, frontend/backend de incidencias
y clasificación. Objetivo: cerrar la clasificación con Groq y validar CU01 sobre
la base corregida del equipo. Este encargo no implica rehacer las cuatro semanas
ni desarrollar los módulos de Roberto o Jasmine.

## 1. Base que debes recibir antes de modificar código

La base corregida incluye el cierre de Roberto `d8d0a37`, posterior a la
integración de Johan `786154d` y Jasmine `c218cf4`. Incluye el pronóstico,
evaluación y notificaciones; no debes rehacer esos módulos.

La publicación se registra en ESTADO_EQUIPO y MEMORIA_PROYECTO. Antes de continuar,
consulta origin/main y comprueba que contiene el cierre; una copia local antigua
no prueba el estado remoto. Revisa tus cambios, worktrees y ramas e incorpora
esa base sin descartar tu trabajo. Conserva tu rama activa o usa clasificacion-ia
según el estado real, sin crear otra implementación paralela.

Mientras recibes la base puedes preparar los casos etiquetados y el guion de
evaluación. No necesitas esperar el pronóstico ni los reportes para hacerlo.

Lee AGENTS.md, MEMORIA_PROYECTO.md, tu plan en planes/PLAN_JOHAN.md y estos archivos:

- [Estado vigente del equipo](../ESTADO_EQUIPO.md).
- [Integración y correcciones del 25 de noviembre](roberto-integracion-equipo-20261125.md).
- [Contrato del flujo y prioridad](../CONTRATO_FLUJO_CASO_PRACTICO.md).
- [Diseño y componentes compartidos](../DISENO_COMPONENTES.md).
- [Operación de Supabase](../OPERACION_SUPABASE.md), [coordinación](../COORDINACION_SUPABASE.md)
  y [registro de migraciones](../REGISTRO_CAMBIOS_BD.md).

Los documentos históricos conservan resultados de sus versiones; no prueban
que la versión actual esté desplegada ni sustituyen el estado de integración.

## 2. Lo que ya existe y debes conservar

| Capacidad | Estado de la base corregida |
| --- | --- |
| Incidencias | Registro idempotente; listado, búsqueda y conteos personales; filtros Todas/Activas/Resueltas. |
| Atención | Cola por llegada/técnico/contextual; responsable, notas, solución y confirmación explícita de falla. |
| Corrección manual | Servicio con motivo e historial; conserva el servicio declarado originalmente. |
| Prioridad | Un cálculo en NestJS, contexto del calendario, política versionada y SLA desde el registro. |
| Clasificación | Adaptador Groq, validación de categoría y escalas, metadatos y derivación manual ante fallos. |
| Privacidad | Groq recibe una proyección de vocabulario técnico cerrado; la descripción completa permanece en el servidor. |
| Historial de IA | Cambio y TicketChange se guardan atómicamente; actor automático nulo, sin atribuir la decisión al titular. |
| Concurrencia | Una respuesta tardía no pisa una corrección humana ni duplica el historial. |
| Acceso | Identidad y permisos efectivos comunes; login corregido tras el fallo del parser JSON. |

Roberto ya confirmó Groq como proveedor. No falta volver a elegirlo. El modelo
configurado por defecto en esta base es `openai/gpt-oss-20b`; cualquier cambio debe
quedar registrado y volver a evaluarse.

La base compartida tenía quince migraciones verificadas. **No reescribas ni
reapliques sus SQL** para reconstruir tu instalación. El detalle y los checksums
están en el registro BD. Una rama Git no aísla Supabase.

## 3. Pendiente J1 — configuración y prueba real del proveedor

1. Obtener una clave de Groq autorizada para la prueba y configurarla privadamente
   como `GROQ_API_KEY` del backend. Conservar `GROQ_MODEL` con el modelo acordado.
   En la instalación de Roberto todavía no había clave configurada al verificarla.
2. Mantener la clave fuera de Git, capturas, logs, archivos compartidos y variables
   Vite. Una clave de otra persona no se obtiene desde su historial o configuración.
3. Reconstruir la única instalación `campusitsm`, conservando volúmenes, sesiones
   y la conexión compartida documentada. No crear otro Compose de revisión.
4. Probar primero con reportes ficticios identificados. Confirmar en el proveedor
   las condiciones y disponibilidad del modelo antes de depender de él; este
   documento no afirma cuotas gratuitas ni disponibilidad permanente.

**Aceptación:** un reporte ficticio guardado produce una propuesta real válida;
se conserva `reportedService`, se guarda la categoría propuesta en `service` y
existen proveedor/modelo/versión/latencia/fecha. Sin clave, el ticket sigue
disponible y queda en revisión manual. No se presenta esta última como una
clasificación exitosa de IA.

## 4. Pendiente J2 — validar el recorrido completo y sus fallos

Ejecuta con cuentas canónicas estudiante y administrador. Cada titular inicia
sesión personalmente cuando corresponda; no cambies roles de cuentas reales
para fabricar un escenario. Usa casos DEMO existentes o datos ficticios de
prueba acordados, sin cargas masivas en la base compartida.

| Prueba | Resultado exigido |
| --- | --- |
| Estudiante registra y vuelve a consultar | Código persistente, un solo ticket al reintentar y conteos del titular coherentes. |
| Groq devuelve propuesta válida | P04/listado/detalle muestran el estado real; TI puede revisar la explicación y el servicio original. |
| Falta clave, hay cuota agotada, error HTTP, red, demora o JSON inválido | Ticket conservado, revisión manual visible y código de fallo útil, sin secretos. |
| Categoría inventada o escala fuera de 1–3 | Respuesta rechazada; nunca se guarda como clasificación válida. |
| Texto con nombre, correo, DNI, teléfono o instrucciones maliciosas | La solicitud saliente contiene solo las señales técnicas permitidas, sin texto libre ni identificadores. |
| Señales insuficientes o reporte ambiguo | Verificar el comportamiento actual y corregirlo si produce una clasificación injustificada; el caso debe poder derivarse a revisión humana. |
| TI corrige mientras llega la respuesta | Se conserva la edición humana y no aparece un cambio de IA tardío. |
| TI corrige servicio | Motivo obligatorio, antes/después y servicio declarado conservados; no altera prioridad ni reinicia plazos por esa sola acción. |
| TI evalúa, asigna, atiende y resuelve | Contexto y prioridad coherentes, responsable visible, primera atención humana real, solución e historial persistentes. |
| Cambio de usuario o institución | Listados/detalles propios aislados; identificadores ajenos no permiten lectura ni escritura. |
| Recarga/reinicio | Tickets, estado, sesión válida e historial se conservan; no se repiten acciones. |

El proveedor propone servicio/urgencia/impacto. **No decide** identidad, permisos,
factor académico, prioridad final, SLA ni resolución. Usa los servicios existentes
de calendario y prioridad. La primera respuesta humana no se sustituye por el
acuse o por la clasificación automática.

Comprueba el presupuesto existente de tres segundos y la salida a revisión.
Reporta por separado la latencia del proveedor y el tiempo total observado de la
operación; no prometas que toda la petición HTTP terminará en tres segundos sin
medir también las consultas y escrituras del backend.

Simula cuotas, errores y concurrencia en pruebas aisladas con dobles del proveedor;
no agotes una cuota real ni modifiques los datos compartidos para provocar fallos.

## 5. Pendiente J3 — evaluar la exactitud de la clasificación

Una llamada válida o los ejemplos del prompt no constituyen una evaluación.

Prepara un conjunto de reportes ficticios etiquetados antes de consultar al modelo,
con varias formulaciones y las categorías vigentes del catálogo. Incluye casos
claros, ambiguos, negaciones, servicios parecidos, entradas sin señales suficientes
y ejemplos que contengan identificadores ficticios para comprobar su exclusión.
Define servicio esperado y urgencia/impacto técnicos con criterios explícitos.

Separa los casos usados para ajustar instrucciones/proyección de los reservados
para evaluación. Si modificas el clasificador después de ver resultados, registra
el ajuste y vuelve a evaluar sobre una reserva independiente. No envíes casos
reales identificables ni recuperes la descripción completa como atajo para mejorar
el resultado: conserva la proyección privada ya corregida.

Entrega, sobre el mismo conjunto:

- Número de casos, categorías cubiertas y criterio de etiquetado.
- Exactitud de servicio y matriz de confusión.
- Acierto de urgencia e impacto, medidos por separado.
- Casos sin respuesta válida, derivados a revisión y errores del proveedor.
- Latencia observada con el procedimiento de medición descrito.
- Proveedor, modelo, versión del adaptador/proyección y fecha de ejecución.
- Ejemplos de errores y límites del enfoque, sin datos personales.

Informa los resultados considerando todos los intentos. Si calculas una exactitud
solo sobre respuestas válidas, muestra también cuántos casos quedaron fuera y por
qué. El 85 % citado en el proyecto es una meta: no se declara alcanzada sin datos
ni se ajustan las etiquetas para producirla. Una exactitud baja se reporta y se
analiza, sin ocultarla detrás de las pruebas funcionales aprobadas.

## 6. Pendiente J4 — regresión y revisión visual

Conserva y amplía las pruebas existentes cuando encuentres un defecto reproducible.
Incluye privacidad, historial atómico, fallback, respuestas tardías, permisos,
idempotencia, conflictos de versión y lectura JSON del login/formularios.

Desde la raíz, el procedimiento aislado del repositorio permite ejecutar:

```powershell
docker build --target test -t campusitsm-workflow-test:local -f apps/api/Dockerfile .
python scripts/verify-workflow.py --tests test/ticket-ai.test.cjs test/ticket-ai.integration.test.cjs test/tickets.test.cjs test/workflow.test.cjs test/http-body-parser.test.cjs
```

Ese runner crea PostgreSQL descartable y no lee `.env` ni apunta a Supabase.
Sus pruebas de proveedor no acreditan llamadas reales. Antes de entregar cambios
de comportamiento, ejecutar también la regresión pertinente del candidato completo.
La referencia de Roberto aprobó 139 pruebas API y 56 recorridos de navegador;
esos resultados no se heredan automáticamente después de nuevas modificaciones.

Para los recorridos de incidencias y acceso, desde `apps/web`:

```powershell
node node_modules/@playwright/test/cli.js test tickets.spec.cjs auth.spec.cjs access.spec.cjs
```

Comparar P02–P08 a 1440 × 900 y 390 × 844 con las láminas finales:
`diseno/campusitsm/01_cu01_ingreso_reporte_v2.png` y
`diseno/campusitsm/02_cu01_seguimiento_atencion_v2.png`. Reutilizar los componentes
existentes, sin rediseñar el tema. Comprobar foco, teclado, desbordamiento y estados
de espera/error. Las capturas con fixtures deben identificarse como tales.

El seguimiento actual consulta periódicamente el servidor. No lo describas como
actualización por eventos si no se implementó y comprobó ese mecanismo.

## 7. Límites y dependencias

- No implementar pronóstico, reportes analíticos, notificaciones o PDF alternativos.
  Roberto conserva pronóstico/calendario/notificaciones y Jasmine constancias/reportes.
- Los adjuntos siguen aplazados para el corte actual. No habilitar almacenamiento
  ni añadir nuevas migraciones por el solo hecho de leer el plan histórico.
- Para las futuras notificaciones, confirmar con Roberto el contrato y los datos
  existentes de asignación/primera atención/resolución. No inventar rutas o un
  segundo servicio mientras se define esa conexión.
- Si una corrección necesita SQL, crear una migración nueva, compatible y validada,
  revisar el historial compartido y registrar destino/ejecutor/verificación. No
  editar migraciones aplicadas, ejecutar reset/db push ni borrar datos compartidos.
- La evaluación de IA y el cierre de incidencias no dependen del pronóstico de
  Roberto ni de las pantallas pendientes de Jasmine. El cierre integrado del equipo
  sí requiere comprobar los contratos y recorridos entre módulos.

## 8. Entrega y condición de cierre

Entregar a Roberto el commit de la rama, el diff revisable y un informe breve con:
base exacta utilizada, configuración sin secretos, pruebas y resultados reales,
evaluación de exactitud, capturas identificadas, problemas pendientes y pasos de
demostración. Distinguir proveedor simulado, llamada real y recorrido autenticado.

- [ ] Base corregida incorporada, con historia preservada.
- [ ] Groq real configurado privadamente y probado con datos ficticios.
- [ ] Fallos del proveedor conservan el ticket y derivan correctamente a TI.
- [ ] Proyección privada, historial atómico y protección de cambios humanos conservados.
- [ ] Recorrido estudiante → IA/revisión → atención/resolución → seguimiento comprobado.
- [ ] Evaluación independiente y métricas entregadas sin presentar metas como resultados.
- [ ] Regresión pertinente aprobada y pantallas revisadas en escritorio/móvil.
- [ ] Pendientes y dependencias documentados; ningún módulo ajeno duplicado.

Esto permite dar por cerrado el bloque de Johan una vez revisado. La publicación
en main y la demostración final conjunta las coordina Roberto, con su autorización
de integración vigente y la validación correspondiente.
