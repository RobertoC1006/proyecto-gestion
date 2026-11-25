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
- Auditoría institucional append-only para emisión, descarga, consulta pública
  de un código existente y resultado de verificación del PDF. El administrador
  puede filtrar por fechas, código, actor y acción.
- Estados diferenciados para constancia encontrada, código inexistente, PDF
  alterado y archivo no verificable.
- La lectura y descarga verifican la huella registrada. Un archivo ausente,
  corrupto o alterado produce un error explícito; no se regenera ni cambia el
  SHA-256 registrado.
- El verificador público recibe un solo archivo multipart de hasta 5 MiB. No se
  incluye el PDF, correo ni identificador de titular en el registro público.

## Contrato y migración

- Las rutas públicas y privadas se exportaron a OpenAPI y sus tipos se
  regeneraron en el cliente web.
- Se añadió la migración aditiva
  `20261120000100_certificates/migration.sql`.
- Crea `Certificate` y `CertificateVerification`; conserva Tickets, identidad,
  usuarios y permisos.
- La API solo recibe permisos de lectura/inserción para las tablas de constancia
  y eventos; la consulta de auditoría siempre filtra por la institución del actor.
- La migración no fue aplicada a Supabase ni a la base compartida.

## Dependencias reales

- La emisión consume la resolución y la falla confirmada existentes en Tickets.
- `APP_ORIGIN` debe apuntar a una URL accesible por teléfono para que el QR
  pueda consultarse desde otro dispositivo.
- La coordinación de notificaciones/aviso no está disponible en este módulo;
  no se creó un servicio paralelo.

## Validación de esta continuación

- La migración se aplicó únicamente en PostgreSQL 17 descartable en Docker,
  mediante `scripts/verify-workflow.py --tests test/certificates.http.test.cjs`;
  el contenedor usó tmpfs, no leyó `.env` y se retiró al terminar.
- Pruebas HTTP: emisión idempotente, descarga privada, aislamiento entre
  titulares, consulta pública mínima, verificación válida/alterada, permisos
  de auditoría, filtros y código inexistente: **7 aprobadas, 0 fallidas**.
- Pruebas unitarias: reutilización, SHA-256, detección de alteración/archivo
  ausente, privacidad, filtro por institución y denegación sin permiso:
  **6 aprobadas, 0 fallidas**.
- API compila; esquema Prisma valida y genera cliente; OpenAPI y tipos web se
  regeneran; frontend compila para producción.
- Pruebas de navegador con Vite local y respuestas API simuladas:
  `apps/web/test/certificates.spec.cjs`, **2 aprobadas, 0 fallidas**; verifican
  filtros/permisos y que un usuario sin permiso no consulta ni ve la auditoría.
- `git diff --check`: correcto; solo reportó avisos de conversión LF/CRLF en
  OpenAPI y tipos generados.
- `npm audit` reportó 3 vulnerabilidades altas en la cadena de dependencias de
  Prisma; no se actualizaron versiones fuera del alcance.
