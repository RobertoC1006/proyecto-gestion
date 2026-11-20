# Flujo del caso práctico de CampusITSM

Encargo expreso de Roberto del 12 de noviembre de 2026: implementar en una rama
nueva el recorrido profesor → actividad académica → reporte → prioridad →
atención → resolución → seguimiento. Rama `flujo-caso-practico`, desde la revisión
de `gestion-incidencias@1667778`, preservando su historia. No autoriza integrar
en main ni iniciar IA, pronósticos, adjuntos, consentimiento o constancias.

## Roles y alcance

La interfaz ofrece Administrador, Profesor (`docente`) y Estudiante. El
administrador asume atención de TI institucional durante el prototipo, mediante
`tickets:read:institution` y `tickets:work:institution`. Profesor obtiene
`academic:teach` y conserva reportes personales; estudiante conserva calendario
y reportes propios. Los valores históricos ti_agente/ti_supervisor se conservan
en PostgreSQL por compatibilidad, sin ofrecerlos en la selección de perfiles.
Las configuraciones RoleAccess existentes no se sobrescriben: si existen,
administración debe habilitar explícitamente las capacidades nuevas desde Permisos.

Se reutilizan Auth, IdentityDirectory, AcademicMembership, AcademicService y
TicketsService; no existe otro login, directorio o cálculo de prioridad en React.
Roberto aplaza la prueba del profesor con una cuenta real; se valida con usuarios
descartables y HTTP en PostgreSQL aislado. No se crean cuentas Auth artificiales.

## Calendario y contexto

Profesor programa exámenes/entregas solo en secciones asignadas. Un evento de
curso completo requiere asociación a todas sus secciones. No crea matrícula ni
eventos institucionales; solo edita actividades de su autoría mientras conserva
la asociación. Administrador conserva gestión institucional. Las asociaciones se
gestionan en `/admin/cursos` con los endpoints académicos existentes.

`GET /academic/me/context?courseId=…&sectionId=…` deriva el titular de la sesión.
Valida asociación y devuelve factor, motivo, evento e instante. General consulta
solo eventos institucionales. Se aplica el mayor factor válido: examen en curso
o futuro <24h, 2; entrega futura <48h, 1.5; matrícula en curso, 1.7; regular, 1.
La evaluación del ticket considera el calendario en el instante de registro;
guarda una instantánea y su motivo. No se deduce un examen por palabras del reporte.

## Operaciones y configuración

Prefijo común `/api/v1`. Todas las operaciones requieren sesión y protección
Origin/CSRF para escrituras. El servidor aplica institución/titular y permisos.

| Ruta | Operación y capacidad |
| --- | --- |
| GET `/operations/tickets` | Cola paginada, `tickets:read:institution`; `order=context/technical/arrival`, filtros status/search/page/pageSize |
| GET `/operations/tickets/:id` | Detalle, contexto e historial de la institución |
| PATCH `/operations/tickets/:id` | `tickets:work:institution`; action, expectedVersion y note de 5–2000 caracteres |
| GET/PATCH `/operations/policy` | `configuration:manage`; cuatro rules, expectedVersion, reason |
| POST `/operations/demo` | Configuración y atención institucional; studentId y professorId opcional, de cuentas canónicas activas |

Acciones de ticket: `evaluate` exige urgency/impact 1–3; `assign` exige assigneeId
con capacidad de atención; `start` asigna al actor y registra primera atención
humana; `note` añade avance durante atención; `resolve` exige solución y
failureConfirmed booleano. Solo se resuelve desde en_atencion y no se reabre.
Cada cambio bloquea el ticket, comprueba versión y actor vigente y guarda
TicketChange en la misma transacción. Respuesta 409 ante edición perdida.

Prioridades iniciales: P1 ≥9, P2 ≥5, P3 ≥3, P4 <3. Respuesta/resolución en minutos:
15/120, 60/240, 240/1440, 480/4320. Reglas editables, versionadas y auditadas en
AcademicChange. Los plazos siempre parten de createdAt; reevaluar no reinicia
el reloj. Las reglas nuevas solo afectan evaluaciones posteriores. SLA continuo.

La cola ordena por puntaje descendente y desempata por registro e ID; pendientes
quedan al final. Excluye resueltos salvo filtro explícito. Comparación técnica
usa urgency×impact; comparación por llegada usa createdAt. El detalle personal
omite las escalas y puntajes técnicos, conserva prioridad, contexto, notas,
solución y plazos. El navegador consulta cada 15 segundos; no se afirma tiempo
real por eventos. Primera respuesta nunca es el acuse automático.

## Datos de demostración

Preparación explícita, una por estudiante/institución, serializada para evitar
duplicados. Crea cursos DEMO-RED/DEMO-PRO, secciones DEMO-A, asociaciones, examen
a 30 minutos y entrega a 12 horas de la preparación, y cuatro tickets con
isDemo=true. Registra autor administrador y notas de origen sintético.
No modifica roles ni contraseñas ni borra reportes. Reintentar conserva los
instantes y no resuelve ni reinicia tickets. Para otra fecha de demostración,
preparar un escenario nuevo de forma coordinada; no prometer renovación automática.

Resultados esperados: T1 3×2×2=12/P1, T2 3×3×1=9/P1, T3 2×2×1.5=6/P2,
T4 2×1×1=2/P4. Permiten probar la regla; no prueban una reducción porcentual
de tiempos ni precisión de IA o pronóstico.

## Comprobaciones

`python scripts/verify-workflow.py` crea únicamente PostgreSQL descartable sin
puertos, aplica el historial y ejecuta flujo HTTP y regresión de identidad,
permisos, calendario y usuarios. No lee .env, la prueba exige host db y base
workflow_test, y retira el contenedor y la red al terminar. No deja otra app.
Las pruebas de profesor aisladas no sustituyen una sesión Supabase real.
