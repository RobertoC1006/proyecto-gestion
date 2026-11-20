# Entrega del flujo contextual del caso práctico

12 de noviembre de 2026. Encargo de Roberto y rama `flujo-caso-practico`.
Código inicial `48b78d8`, conservando la historia de Johan `1667778` y la revisión
previa. Sin integración ni publicación en main; ramas de compañeros intactas.

## Resultado

Tres perfiles visibles: administrador, profesor y estudiante. Administrador
asume TI institucional en el prototipo. Profesor programa actividades de sus
cursos/secciones asignados; estudiante consulta calendario y reporta problemas
con el contexto precargado. Administración gestiona cursos y asociaciones,
reglas de prioridad y SLA, cola, evaluación, asignación, atención y resolución.
El titular ve prioridad, historial, plazos y solución; las escalas técnicas
permanecen en operaciones. Actualización por consulta cada 15 segundos.

Se reutilizan componentes, identidad y módulos del repositorio. El factor se
obtiene del calendario y la asociación; la evaluación guarda su instantánea en
el instante de registro. Operaciones y cambios de estado son transaccionales,
con versión y revalidación del actor. Reevaluar nunca reinicia el reloj de SLA.
La interfaz conserva la versión al comenzar una edición, aunque se actualice
la consulta en segundo plano, para no ocultar conflictos concurrentes.

Contrato: [CONTRATO_FLUJO_CASO_PRACTICO.md](../CONTRATO_FLUJO_CASO_PRACTICO.md).

## Base compartida

Dos migraciones aplicadas por autorización específica posterior de Roberto.
Diez migraciones y checksums coincidentes. Tablas nuevas privadas con RLS y
acceso exclusivo del servidor; el historial no admite UPDATE por el rol API.
No se borraron registros ni se guardó un volcado completo de datos privados.
Ver [REGISTRO_CAMBIOS_BD.md](../REGISTRO_CAMBIOS_BD.md).

Preparación explícita desde la sesión administradora real con la cuenta
estudiante seleccionada: dos cursos/secciones, sus asociaciones, dos actividades
y cuatro tickets isDemo. Puntajes y prioridades comprobados: 12/P1, 9/P1,
6/P2 y 2/P4. T1 pasa antes de T2 solo en orden contextual; criterio técnico
coloca T2 primero. No se confunde esta comparación con orden por llegada.

## Validación

- API y web compilan; OpenAPI y tipos regenerados.
- `scripts/verify-workflow.py`: 58 pruebas aprobadas en PostgreSQL descartable.
  Incluye identidad, permisos, usuarios, calendario y recorrido HTTP del caso.
- Profesor aislado: programación permitida en sus secciones, rechazo de otras
  secciones e institución, sin conceder administración global.
- Flujo aislado: reintentos sin duplicados; otra cuenta/institución no ve el
  ticket; conflicto de versión; primera respuesta humana; resolución y política.
- Pantalla con sesiones reales de Roberto y estudiante: cola comparativa,
  detalle del examen y creación del escenario; atención y resolución de T1;
  calendario/listado/contexto y solución visibles desde estudiante.
- Reinicio de API conserva sesión, cuatro reportes y T1 resuelta.
- Ajustes finales del navegador compilados y pruebas afectadas adaptadas;
  sintaxis comprobada. No se declara toda la suite Playwright ejecutada.

Las capturas locales están en `outputs/flujo-caso-practico/`. La pestaña queda
abierta en el seguimiento personal de T1. El historial y la solución explican
que el caso es simulado; no se afirma haber reparado una plataforma académica.

## Límites y continuación

Roberto aplazó la prueba del profesor con una cuenta Supabase real; se mantiene
pendiente pese a las pruebas aisladas aprobadas. No se crearon identidades ni se
cambiaron roles reales para simularlo. Los valores históricos de TI se conservan
por compatibilidad, pero la interfaz ofrece los tres perfiles acordados.

Los compañeros deben incorporar el nuevo contrato/esquema antes de operar los
estados en_atencion/resuelto. Las migraciones permanecen aplicadas al cambiar
de rama. Los paquetes de planes se regeneran con el estado vigente.
No se enviaron mensajes al equipo. IA, pronóstico, PDF/QR, adjuntos y
consentimiento/auditoría global permanecen pospuestos. No se afirma reducción
porcentual de tiempos ni precisión de clasificación o pronóstico.
