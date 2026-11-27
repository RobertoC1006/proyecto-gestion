# Johan — clasificación y evidencias para revisión

Fecha: 27/11/2026. Rama: `gestion-incidencias`, actualizada por avance rápido desde `origin/main@be57841`. Este documento describe código de la rama; no afirma que Roberto haya integrado este nuevo trabajo.

## Clasificación de incidencias

Se midió el adaptador Groq v5 con una reserva nueva de 15 reportes ficticios etiquetados previamente. Aparecieron dos falsos conflictos de servicio: «Redes» como curso y un correo de contacto. Se corrigieron los patrones y se incrementó la versión a v6. La versión v6 se midió con **otra** reserva nueva de 15 casos, sin modificar después sus etiquetas. Ambos archivos JSON conservan por caso la etiqueta, propuesta, fallos y latencia; no contienen claves ni reportes reales.

| Adaptador y reserva | Categoría en 12 casos clasificables | Urgencia | Impacto | Respuestas válidas sobre 15 | Revisión manual esperada / observada | Latencia p50/p95 de válidas |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| v5, holdout3 | 10/12 | 7/12 | 8/12 | 10/15 | 3 / 5 | 668 / 964 ms |
| v6, holdout4 | 11/12 | 11/12 | 10/12 | 11/15 | 3 / 4 | 971 / 1112 ms |

En v6 hubo una respuesta `unavailable`, dos ambigüedades y un caso sin señales. Las dos reservas son pequeñas y diferentes: estos datos no prueban una mejora causal ni acreditan el objetivo general del 85 %. La clave Groq se cargó únicamente desde `.env` para la evaluación, nunca se copió a Git o al navegador. La proyección sigue enviando solo señales técnicas cerradas. La latencia medida es la llamada al clasificador, no el tiempo completo de crear el ticket.

## Evidencia opcional del ticket

Se prepararon las tres rutas de `docs/CONTRATO_EVIDENCIAS.md`: PUT idempotente, GET de metadatos y GET de descarga autorizada. La API comprueba institución y titular en cada ruta; TI y administradores no reciben acceso implícito. Valida Base64 canónico, nombre, extensión/MIME y bytes decodificados con Sharp o PDF-lib, tamaño 1..5242880, SHA-256 e integridad al descargar. Los bytes se envían únicamente a un bucket privado de Supabase Storage desde NestJS, con clave de servidor independiente; PostgreSQL contiene solo metadatos. No se exponen URL de Storage ni `storageKey`.

La creación del ticket termina primero. Si falla la carga, P03 conserva el código y permite reintentar PUT sin repetir POST. P04 y el detalle muestran ausencia o presencia del archivo y ofrecen descarga. El archivo no puede reemplazarse ni borrarse desde la aplicación. Un bloqueo de fila y la clave opaca por intento serializan las cargas del mismo ticket; ante resultado de COMMIT incierto se comprueba la fila antes de limpiar. La reconciliación es un comando **manual**, primero de solo lectura, para objetos de más de 24 horas sin metadatos. Nunca se ejecuta en el arranque.

La migración nueva `20261127000100_ticket_attachment_limits` añade máximo de 5 MiB e índice académico sin editar SQL aplicado. **Solo se aplicó en PostgreSQL descartable**. La API exige esta migración cuando se configura `SUPABASE_STORAGE_SECRET_KEY`; sin esa clave, el módulo queda desactivado y las 18 migraciones existentes permiten arrancar el resto del proyecto. No se ejecutó ninguna migración en Supabase.

## Validación realizada y pendiente

- API y web compilan. OpenAPI y tipos web se regeneraron.
- 158 pruebas API pasaron con las 19 migraciones en PostgreSQL temporal sin red; el contenedor se eliminó. Luego pasaron 5 pruebas focalizadas, incluida concurrencia real de dos PUT sobre PostgreSQL temporal: una fila y un objeto. Validación de formatos, límites, reintento 200, conflicto 409, acceso ajeno 404 y compensación en fallos con almacenamiento simulado.
- Seis recorridos Playwright de tickets pasaron con Chrome y respuestas API ficticias, incluido error de Storage seguido de reintento sin otro POST. No acreditan bytes guardados en Supabase.
- El resto de la suite visual requiere el Nginx/API real en `localhost:8080`; el servidor estático usado para las pruebas de tickets no reproduce sus controles de IP ni rutas API. Los fallos de esa ejecución parcial no se atribuyen al código de incidencias.
- **Pendiente de Roberto:** crear/verificar bucket privado `campusitsm-evidencias`, límite 5 MiB y MIME, ausencia de políticas públicas, entrega privada de credencial de servidor. Aún no se dispone de bucket ni clave.
- **Pendiente después de esa habilitación:** revisar/aplicar manualmente la migración con el rol migrador; configurar `SUPABASE_STORAGE_SECRET_KEY` solo en `.env` de API; reconstruir; probar carga/descarga desde dos instalaciones, rechazo de acceso directo al bucket y sesión real de estudiante. No habilitar la clave antes de la migración. Registrar destino, checksum, ejecutor y resultado en `REGISTRO_CAMBIOS_BD.md`.

## Presentación desde la laptop

La parte actual de CU01 (registro, Groq, prioridad, atención, resolución y seguimiento) puede presentarse con los datos y cuentas autorizadas de la instalación normal. Con Storage sin configurar, P03 indica que la evidencia aún no está habilitada y permite continuar sin archivo. Mostrar el flujo de reintento de evidencia únicamente como prueba de interfaz con fixture y declararlo como tal. No presentar la carga privada entre computadoras como completada hasta verificarla con el bucket real.
