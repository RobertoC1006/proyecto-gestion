# Avisos y alertas — contrato v1

Los productores usan `publishNotification(tx,event)` dentro de su transacción
Prisma. NotificationEvent es la outbox persistente; su ID estable evita repetir
una misma acción. Se consume con bloqueo SKIP LOCKED y crea Notification una sola
vez por destinatario/evento. Un rollback de la acción tampoco publica avisos.
Tipos actuales: assignment, resolution, certificate, sla80, sla_overdue, demand.
No incluir descripciones libres, correos ni otros datos personales en avisos.
`isDemo` se propaga desde Ticket o fuente sintética.

`GET /api/v1/notifications?type=&unread=true&page=1`: solo destinatario e
institución de la sesión; páginas de 30, total y unreadCount global propio.
`PATCH /notifications/:id/read`: lectura idempotente; ajeno responde 404.
`GET /notifications/events`: SSE sin contenido privado; señala volver a consultar
con sesión/permisos actuales. Al reconectar se invalida la consulta. Respaldo por
consulta cada 30 segundos. No se necesitan permisos de un módulo ajeno para ver
el buzón personal; los enlaces conservan sus controles de acceso.

Productores conectados: asignación/inicio/resolución de OperationsService y
emisión original de CertificatesService. Reemitir una constancia existente no
publica otro aviso. El escáner revisa primera respuesta al 80 % y al vencer;
firstResponseAt humano detiene los avisos, y no usa la clasificación automática
como atención. Destino: responsable activo autorizado o operadores institucionales.

`GET /alerts?source=operational|synthetic`, `GET /alerts/:id`: permiso efectivo
reports:read:institution. Solo semanas completas de siete días previstos; suma en
tickets/semana frente a capacidad configurada. Una fila por institución/fuente/
semana se actualiza, y el aviso semanal no se duplica. Se conserva la revisión
humana. Cuando deja de superar capacidad, active=false conserva el historial.
`PATCH /alerts/:id/review {reason}` requiere configuration:manage; revisión
idempotente y AcademicChange auditable. No cambia prioridades, turnos ni tickets.

El trabajador común pg-boss ejecuta el escaneo y consumo cada minuto. Sus tareas,
avisos pendientes, lecturas, resultados y alertas sobreviven a reinicios. Ningún
proceso exige claves de correo o un servicio externo para estos avisos internos.
