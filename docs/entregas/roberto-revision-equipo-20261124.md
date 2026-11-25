# Revisión de las entregas de Johan y Jasmine

24 de noviembre de 2026. Base de la revisión: candidato local `9294147`,
con `main@d8ef0ca` y las cuatro ramas de colaboración registradas en la copia.
Se comprobó por ascendencia que los cambios están reunidos. Las referencias de
esta copia corresponden a las entregas del 20. La red del entorno impidió
consultar GitHub para determinar si hubo publicaciones posteriores.

| Entrega | Resultados y coherencia con el plan | Pendientes del bloque |
| --- | --- | --- |
| Johan, incidencias `622c43b` | Conteos propios, filtros, responsable de TI y corrección manual de servicio con motivo e historial. Reutiliza identidad, calendario, estados y prioridad contextual. | Prueba autenticada del recorrido en la instalación habitual. Los adjuntos y la IA conservan su alcance aplazado para este corte. |
| Jasmine, constancias `7becc12` | El titular solicita tras resolución y falla confirmada. El candidato conserva el PDF y su huella, separa consulta del código y validación del archivo, y comprueba titular e institución en las rutas privadas. | Validar PDF real en la instalación, URL del QR desde otro dispositivo y recuperación de archivos originales. El candidato almacena el PDF en el volumen local de emisión y el índice en la base compartida. Revisar vista previa del PDF y campos del documento contra el plan. |
| Jasmine, consentimiento y auditoría `4ae4b6b` | La aceptación es explícita y versionada. Auditoría reúne fuentes existentes, con permiso institucional, antes/después y CSV. | Confirmar política vigente y migración en Supabase. Preparación analítica anonimizada y eventos de constancias en la auditoría global siguen pendientes. |
| Jasmine, reportes `750bf86` | Conteos operativos y CSV reutilizan la selección de tickets. El origen de demostración se identifica y las métricas sin datos se indican como no disponibles. | Falta conectar el pronóstico de Roberto al publicarlo y contrastar resultados con la base común. |

## Correcciones de esta revisión

- Consentimiento accesible desde la navegación de cada persona autenticada.
  Auditoría tiene entrada propia y protege pantalla y servidor por permiso.
- Auditoría conserva los valores de fecha/hora local, los convierte a UTC al
  consultar y aplica los mismos filtros de fecha, actor y objeto al CSV. El
  CSV trata los prefijos de fórmulas como texto y la pantalla devuelve errores
  de exportación.
- Verificación pública accesible con o sin código en el enlace. El límite de
  verificación se alinea con el PDF anunciado de 5 MiB después de codificarlo,
  tanto en NestJS como en el proxy de la aplicación.
- La vista del titular usa nombres de servicio legibles y muestra fallos al
  descargar. La verificación se ajusta al ancho móvil. Reportes valida el
  alcance solicitado y comunica los fallos de exportación.

## Evidencia y condición de integración

El candidato anterior documenta 113 pruebas con PostgreSQL aislado, 2 adicionales
de auditoría y 11 de navegador. La revisión actual recompiló la web y generó
Prisma. Los recorridos actuales de navegador emplean respuestas de prueba.
Las cinco capturas del escenario también usan datos de demostración.

La compilación completa de API, la revalidación con PostgreSQL y el arranque de
`localhost:8080` quedaron pendientes. El entorno carecía de dependencias de
PDF/QR y tipos de Express en caché, de acceso a Docker y de autorización del
conector a la organización CampusITSM. Queda por verificar y coordinar
`20261112000100_consent` y `20261120000100_certificates` antes de activar la API
del candidato en la base compartida. Esta revisión no aplicó migraciones ni
integró el candidato en main. Revisar el historial remoto antes de publicar.
