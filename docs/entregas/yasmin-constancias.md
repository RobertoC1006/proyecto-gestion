# Yasmin · Constancias verificables P09-P12

## Implementación actual

- Elegibilidad basada únicamente en un ticket propio de la institución con estado
  `resuelto` y `failureConfirmed=true`.
- Emisión persistente con una sola constancia por ticket y reutilización ante
  solicitudes repetidas.
- PDF real generado con `pdf-lib`, código `CITS-*`, QR público y huella SHA-256
  del archivo final.
- Almacenamiento local bajo `FILES_DIR`, con el volumen `files_data` previsto por
  Compose.
- Descarga privada protegida por sesión y permiso
  `certificates:request:self`.
- Consulta pública mínima sin correo, adjuntos, descripción ni historial.
- Comprobación pública del PDF presentado contra la huella registrada.
- Estados diferenciados para constancia encontrada, código inexistente, PDF
  alterado y archivo no verificable.

## Contrato y migración

- Las rutas públicas y privadas se exportaron a OpenAPI y sus tipos se
  regeneraron en el cliente web.
- Se añadió la migración aditiva
  `20261120000100_certificates/migration.sql`.
- Crea `Certificate` y `CertificateVerification`; conserva Tickets, identidad,
  usuarios y permisos.
- La migración no fue aplicada a Supabase ni a la base compartida.

## Dependencias reales

- La emisión consume la resolución y la falla confirmada existentes en Tickets.
- `APP_ORIGIN` debe apuntar a una URL accesible por teléfono para que el QR
  pueda consultarse desde otro dispositivo.
- La coordinación de notificaciones/aviso no está disponible en este módulo;
  no se creó un servicio paralelo.

## Validación aislada completada

- Migración `20261120000100_certificates/migration.sql` aplicada en PostgreSQL
  17 local dedicado, sin uso de `.env`, Supabase ni la base compartida.
- Las 11 migraciones quedaron registradas en la base de prueba; la migración
  final creó las tablas `Certificate` y `CertificateVerification`, índices,
  claves únicas y relaciones con Institution, Ticket y AppUser.
- Pruebas HTTP reales aprobaron emisión repetida, descarga privada, restricción
  a otro usuario, consulta pública mínima, PDF válido, PDF alterado, ticket ajeno
  y código inexistente.
- Pruebas unitarias aprobadas para reutilización, SHA-256, PDF alterado y
  privacidad pública.
- API y web compilan correctamente.
