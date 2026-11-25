# Contrato analítico de Roberto — v1, 25/11/2026

El navegador consume NestJS con sesión/CSRF comunes, nunca Python ni PostgreSQL.
`GET /api/v1/demand?source=operational|synthetic` requiere permiso efectivo
`reports:read:institution`. Un reporte de equipo no obtiene acceso institucional
por conocer la URL. La fuente por defecto es real; ambas fuentes permanecen separadas.

Respuesta: `status`, `source`, `config`, `latest`, `runId`, `generatedAt`, `stale`,
`result`. `latest` describe la última tarea, mientras `result` conserva la última
corrida válida cuando una posterior falla. No inferir éxito de que haya una tarea.
Estados: not_generated, queued, running, failed, unavailable, available.

`result` incluye días observados `{date,count}`, 14 días previstos
`{date,value,lower,upper}`, unidad tickets/day, zona America/Lima, ventana,
origen, modelo, semilla (solo sintético), parámetros, bibliotecas, datasetHash,
artefacto y su SHA-256. Rango 95 % exclusivamente si existe en SARIMAX;
la referencia semanal devuelve límites null. No sumar límites diarios para
presentar un intervalo semanal: no son un intervalo de la suma.

La evaluación compara tres cortes temporales de 14 días sin solaparse,
misma ventana de prueba para ambos métodos. MAE en tickets/día; MAPE excluye
reales cero y comunica zeroExcluded. Un ajuste fallido invalida al candidato;
la referencia semanal puede ganar. No se acredita desempeño real con sintéticos.
Los eventos académicos modificados después del corte se excluyen conservadoramente.

Para P15 de Jasmine: reutilizar esta respuesta, identificar fuente/fecha/unidad,
agregar observaciones y pronóstico al mismo periodo y no mezclar el histórico
sintético con métricas operativas. El pronóstico institucional agregado no se
presenta como pronóstico filtrado por categoría/estado/equipo. Mantener esos
filtros en el reporte operativo y señalar cuándo no aplican al pronóstico.

`POST /demand/runs {source,kind:forecast|evaluate}` requiere configuration:manage;
una solicitud manual por fuente/tipo/día es idempotente. Ejecuta vía pg-boss;
no bloquea la pantalla. `PATCH /demand/config` recibe weeklyCapacity,
observedFrom (cobertura completa declarada o null), expectedVersion y reason.
Nunca rellenar ceros fuera de la cobertura ni antes del primer ticket real.
Los tickets isDemo se excluyen. Se requieren al menos 126 días consecutivos.

Programación: 06:00 diaria; evaluación domingo 02:00 America/Lima.
Al reiniciar se recupera la última ocurrencia omitida y las tareas pendientes.
Último resultado válido conservado ante falla; reintentos limitados y persistidos.
El conjunto sintético genera exactamente 43 000 registros sin personas durante
24 meses y queda únicamente en el volumen models_data, nunca en Ticket.

SQL y colas se instalan mediante migraciones manuales versionadas. pg-boss
12.39.0 arranca con migrate:false y createSchema:false; no usar upgrades
automáticos de su esquema. Artefactos internos en models_data por UUID de corrida.
Los pickle se generan localmente y no se cargan desde archivos subidos.
