# Johan — clasificación de incidencias con Groq (revisión local)

## Actualización de integración — 25 de noviembre

Roberto confirmó Groq. La integración agrega proyección de vocabulario técnico
sin texto libre/identificadores y auditoría atómica de clasificación/fallback.
La migración de IA está validada y aplicada a CampusITSM, junto con el actor
automático nullable. Falta la clave privada de Groq en esta instalación y el
recorrido con sesión real. La documentación debajo describe la entrega local
original; el estado vigente está en [la integración](roberto-integracion-equipo-20261125.md).

**Rama:** `gestion-incidencias`. **Estado:** cambios preparados para revisión de Roberto; no integrados en `main`. La elección del proveedor y la publicación del módulo siguen sujetas a la coordinación indicada en `planes/PLAN_JOHAN.md`.

## Alcance implementado

1. Después de crear un ticket y su código, NestJS envía únicamente su descripción a Groq mediante `openai/gpt-oss-20b`. No envía nombre, correo, identificadores, curso ni adjuntos. El adaptador exige JSON con un servicio del enum `TicketService`, urgencia e impacto enteros de 1 a 3, y explicación. NestJS vuelve a validar la respuesta.
2. Se conserva `reportedService`, el servicio elegido por quien reportó. Si la propuesta es válida, `service` registra la clasificación de IA; TI puede corregirla con los controles existentes. Se guardan proveedor, modelo, versión del adaptador, explicación, tiempo de respuesta, fecha y código de fallo, sin persistir la clave ni el contenido HTTP de error.
3. NestJS calcula prioridad y plazos con el contexto académico y la política de prioridad ya existentes. Los plazos comienzan en `createdAt`. Groq no decide prioridad, SLA, identidad, permisos ni resolución.
4. Ante falta de clave, cuota agotada, red, salida inválida o demora superior a 3 segundos, el ticket permanece guardado y pasa a `revision_manual`. Un bloqueo por versión/estado impide que una respuesta tardía reemplace una corrección de TI.
5. P04 y el listado personal muestran `ia`, `revision_manual` o `manual`; el detalle P06/P08 muestra el estado y, para TI, la explicación de la propuesta y el servicio originalmente reportado. Se actualizaron OpenAPI y los tipos generados del frontend.

## Archivos de implementación

- `apps/api/src/tickets/groq-ticket.adapter.ts`: solicitud HTTP, límite de espera y validación de la propuesta.
- `apps/api/src/tickets/ticket-ai.service.ts`: transición de estado, cálculo académico y control de concurrencia.
- `apps/api/src/tickets/tickets.service.ts`, `tickets.module.ts` y `tickets.dto.ts`: integración después del guardado y contrato de respuesta.
- `apps/web/src/app/incidencias/registrada/page.tsx`, `apps/web/src/features/tickets/TicketRow.tsx`, `WorkflowDetail.tsx` y `apps/web/src/lib/api/workflow.ts`: mensajes visibles según el estado real.
- `compose.yml` y `.env.example`: variables `GROQ_API_KEY` y `GROQ_MODEL` solo para la API. El `.env` privado no forma parte de esta entrega.
- `apps/api/prisma/schema.prisma` y `apps/api/prisma/migrations/20261120000100_ticket_ai_classification/migration.sql`: estados y metadatos aditivos; conserva los tickets previos y rellena `reportedService` para ellos.
- `docs/api/openapi.json` y `apps/web/src/lib/api/schema.d.ts`: artefactos regenerados desde el contrato NestJS.
- `apps/api/test/ticket-ai.test.cjs`: respuestas válidas e inválidas, cuota, ausencia de clave y protección contra actualización tardía.

## Base de datos y seguridad

La migración `20261120000100_ticket_ai_classification` se aplicó el **20 de noviembre de 2026** exclusivamente a PostgreSQL local mediante `docker compose -f compose.yml -f compose.local.yml --profile tools run --rm migrate`. El destino confirmado fue `db:5432`, base `campusitsm`, esquema `public`; once migraciones quedaron aplicadas. No se ejecutó contra Supabase PostgreSQL. Un commit Git solo registrará el SQL; **no ejecuta migraciones**. El arranque normal tampoco las ejecuta y la API exige que el historial coincida antes de iniciar.

El modo de pruebas es `docker compose -f compose.yml -f compose.local.yml up -d --build --wait`. `compose.local.yml` sustituye `DATABASE_URL` por `db:5432` aunque el `.env` contenga otra URL. Supabase Auth permanece como servicio de acceso: usar PostgreSQL local no crea un login alternativo. La descripción de un reporte sí sale a Groq cuando hay clave, de modo que las pruebas iniciales deben utilizar texto ficticio.

## Verificación realizada

- `prisma generate`, compilación de API y frontend, exportación OpenAPI y generación de tipos: correctas el 20 de noviembre.
- `node --test test/tickets.test.cjs test/ticket-ai.test.cjs`: nueve pruebas aprobadas.
- Llamada real desde el contenedor local a Groq con texto ficticio: devolvió `aula_virtual`, urgencia 2, impacto 2 y explicación válida. No se usó un ticket real para esta prueba.
- Migración local aplicada y servicios Docker saludables. El 24 de noviembre se confirmó que el endpoint local de salud responde y que Auth está configurado; la base local contenía una institución, una cuenta estudiante y dos tickets. Estos conteos no prueban el recorrido completo de un nuevo ticket con sesión.

## Pendiente para Roberto y cierre de Semana 3

- Confirmar Groq como proveedor de la etapa y revisar el envío de descripciones, la política de datos y las cuotas vigentes.
- Revisar SQL, estados, metadatos y compatibilidad con la base compartida antes de cualquier aplicación remota. No ejecutar la migración de este commit en Supabase sin esa coordinación.
- Probar desde la interfaz un reporte ficticio con una sesión estudiante y la revisión posterior con una cuenta TI/administradora **local**. La base local comprobada no tenía ese segundo perfil. La revisión automatizada del navegador no concluyó porque Computer Use no pudo determinar con certeza la URL activa.
- Evaluar exactitud con reportes etiquetados independientemente del prompt y publicar métricas medidas. Las pruebas actuales verifican el contrato y una llamada real, no acreditan una tasa de acierto ni el objetivo del 85 %.
