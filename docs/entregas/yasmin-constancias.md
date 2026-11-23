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

## Corrección de integridad y ruta pública — T2

- `/verificar/:codigo` se monta en una `Route` pública real: una URL de QR
  consulta su código sin exigir sesión y el formulario actualiza ese parámetro.
- La huella SHA-256, identidad, código y fechas de una emisión ya registrada
  no se sustituyen para recuperar un PDF. Los cambios posteriores de nombre de
  titular/institución no convierten un documento nuevo en el original.
- Si el archivo falta, no se puede leer o no coincide con la huella emitida,
  emisión repetida, detalle y descarga responden **503**:
  `CERTIFICATE_FILE_UNAVAILABLE`, con el mensaje exacto:
  «El PDF original no está disponible. La emisión y su huella se conservan para verificar el archivo original.»
- La lista privada conserva los metadatos originales. La consulta pública del
  código sigue disponible y el PDF original presentado sigue verificando como
  `valida`; otro contenido sigue siendo `alterado`. La consulta de código sola
  no acredita integridad de bytes. El nombre público continúa enmascarado.
- No se regenera automáticamente: no se almacenan todos los campos originales
  renderizados (nombre completo del titular/institución, origen del QR y
  metadatos del generador) para garantizar los mismos bytes. La recuperación
  requiere restaurar una copia exacta del PDF original; no se ofrece una
  reemisión que reemplace su huella ni se modifica el esquema.
- En nuevas emisiones, los bytes se escriben antes de confirmar la transacción
  que bloquea el ticket, permitiendo que solicitudes simultáneas reutilicen la
  misma emisión. La descarga entrega los mismos bytes que acaba de verificar,
  conservando `Cache-Control: private, no-store` y los controles de sesión,
  permiso, institución y titular. Los errores de archivo no se ocultan.

## Evidencia de la corrección T2

- RED en el código previo: tres recorridos públicos de navegador fallaron
  porque no se consultaba el código de la URL. Los casos HTTP de archivo
  ausente/corrupto demostraron que la huella registrada era sustituida.
- GREEN: cuatro recorridos de navegador con API simulada y bloqueo de toda API
  no simulada; 16 comprobaciones focalizadas de constancias y 79 comprobaciones
  en la suite conjunta de constancias, tickets, flujo, calendario, identidad,
  permisos y usuarios, sin fallos ni omisiones.
- Compilaciones de API/web aprobadas. PostgreSQL, almacenamiento y frontend de
  prueba fueron descartables y aislados, sin consultar `.env`, Supabase o la
  instalación habitual. Los cambios de nombres y fallos de archivo se inyectan
  únicamente en las fixtures de prueba; se comprueban resultados y metadatos
  por HTTP, no leyendo filas de constancias como aserción.
- Límite histórico de la primera entrega: no se podían comprobar por HTTP los
  conteos de `CertificateVerification`, porque no existe una consulta pública de
  ese historial. La verificación independiente posterior (mwqymi8b-b-pegf),
  reportada por el coordinador, cerró esa carencia con espías de escrituras y
  metadatos a través de métodos públicos de `CertificatesService`: 16 pruebas
  API y tres sondeos de servicio sin bloqueos. No se añadió un endpoint de
  auditoría ni se consultó almacenamiento privado real.
- Los tres sondeos están conservados en
  `apps/api/test/certificates.integrity.test.cjs`, con base simulada y archivos
  temporales propios: fallo inicial ENOTDIR sin publicación ni auditoría y con
  centinela intacto; reintento con bytes/huella presentes antes del commit;
  archivos ausentes, vacíos o directorios con 503 sin cambiar emisión, huella,
  auditoría o contenido; identificadores inválidos con 400 y otro titular o
  institución con 404 sin mutaciones. Tras restaurar el original se conserva la
  emisión y su PDF verifica como válido, con una única escritura de auditoría.
- En la reanudación de persistencia, `node --check` del test de integridad pasó.
  Su ejecución montada de solo lectura en la imagen existente
  `campusitsm-cert-t2:cert-t2-o4e4ihmg-green` no llegó a iniciar las pruebas:
  Docker no pudo conectar con `dockerDesktopLinuxEngine` (pipe inexistente).
  Esta limitación ambiental no es un fallo funcional ni una nueva prueba GREEN;
  queda pendiente repetir ese comando cuando el motor esté disponible. No se
  reconstruyó la imagen ni se repitieron las suites completas o de navegador.
- La primera ejecución del navegador falló por resolución de dependencias del
  runner temporal; se corrigió la ubicación de su configuración. Tras corregir
  la ruta pública, dos selectores de prueba requerían incluir el texto de ayuda
  en el nombre accesible; se ajustaron al prefijo observado, sin cambiar la UI.
  Estos fallos de preparación/selectores no se presentan como RED funcional.

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
