# Evidencias de incidencias — contrato de implementación

11 de noviembre de 2026. Coordinación: Roberto. Implementación de P03,
controladores, validación, Prisma y pruebas: Johan, en su módulo de incidencias.
Base: su Corte 3 `90a2790` y main con cursos propios `f4a4457`.

Diseño definido durante la revisión solicitada por Roberto. **El almacenamiento
remoto y las rutas de archivos todavía no están implementados ni habilitados.**
La arquitectura concreta recomendada para habilitar es Supabase Storage privado
en el proyecto CampusITSM existente; no se ha creado el bucket ni entregado una
credencial de Storage. Esta definición no acredita acceso remoto del conector.

## Producto y límites

| Decisión | Primera versión |
| --- | --- |
| Cantidad | Cero o un archivo por ticket; opcional al registrar |
| Tipos | PNG (`image/png`), JPEG/JPG (`image/jpeg`), PDF (`application/pdf`) |
| Tamaño binario | De 1 a 5242880 bytes, inclusive: 5 MiB |
| Cambio posterior | Sin reemplazo ni borrado de evidencia desde la aplicación en este corte |
| Visibilidad | Titular activo del ticket en su institución, con permisos personales existentes |
| Equipo TI y constancias | Se coordinarán al implementar atención/constancias; no ampliar ahora las consultas personales |
| Persistencia | Bytes en almacenamiento privado común; PostgreSQL conserva solo metadatos |

## Almacenamiento común recomendado

- Un bucket `campusitsm-evidencias` del proyecto `npjibnlxepiwfermtcmo`,
  `public=false`, límite de archivo 5242880 y los tres MIME anteriores.
- Las tres instalaciones consumen el mismo bucket mediante NestJS. No usar los
  volúmenes locales para presentar disponibilidad de archivos entre computadoras.
- Un cliente Storage de servidor independiente del cliente Auth; sin persistir
  sesión ni renovar tokens de usuarios. Usar una credencial secreta de servidor
  de CampusITSM, entregada por medio privado y con el menor alcance disponible.
  Si se emplea service_role/secret con acceso privilegiado, reconocer que omite
  RLS: la autorización por titular/institución es obligatoria en cada operación.
- Credencial únicamente en la API, separada de DATABASE_URL, de la credencial
  migradora y de la clave de cifrado local. No agregarla al navegador, ZIP,
  respuestas, registros ni al cliente que realiza login de usuarios.
- La aplicación no crea buckets ni cambia políticas al arrancar. La habilitación
  es un paso explícito de infraestructura, revisado y registrado. Comprobar cuotas
  disponibles del proyecto; no contratar ni cambiar de plan automáticamente.
- No crear políticas para que anon/authenticated lean, listen, suban o cambien
  objetos de este bucket directamente. Revisar políticas existentes para evitar
  que una política amplia de otro bucket incluya este por accidente.
- Claves de objeto opacas y aleatorias del servidor, sin directorios ni nombre
  original; mantener el CHECK actual de `storageKey`. Usar `upsert=false` y jamás
  sobrescribir evidencia. No devolver el bucket, storageKey o URL de Storage.

Se recomienda descarga a través de NestJS en cada solicitud, sin URL pública ni
URL firmada entregada al navegador. Así se revisa el acceso actual antes de
transferir el archivo, incluso cuando una cuenta ha sido desactivada.

## Transporte compatible con la protección actual

Para este primer límite pequeño se define carga **JSON con Base64** entre React
y NestJS. Mantiene `CampusSessionGuard`, Origin y X-CSRF-Token existentes, que
actualmente exigen JSON en las escrituras. NestJS decodifica y envía bytes a
Storage. Base64 se usa solo durante el transporte, nunca en PostgreSQL ni logs.

Hay un costo de memoria y aproximadamente un tercio adicional de transferencia;
no extender este diseño a archivos grandes. Multipart requeriría una evolución
coordinada de la protección común y no debe habilitarse eliminando sus controles.

El cuerpo Base64 máximo tiene 6990508 caracteres. Antes de decodificar, validar
longitud y sintaxis Base64 canónica, sin prefijo data:, espacios ni campos extra.
Decodificar una sola vez y rechazar más de 5242880 bytes o un archivo vacío.
No confiar en el MIME, tamaño, extensión o hash enviados por el navegador.

Para que el límite sea utilizable, Johan deberá incorporar en su entrega:

- Parser JSON limitado a **7 MiB únicamente para PUT de la ruta exacta de
  evidencia**; conservar el límite actual para las demás rutas y sus métodos.
  Registrar ese parser antes del parser general, evitando que el límite general
  de Nest/Express rechace primero el cuerpo. No ampliar globalmente el parser.
- En Nginx, límite de **8 MiB únicamente para esa ruta PUT**, conservando los
  ajustes y el límite de las demás rutas. Preservar el proxy, las cabeceras de
  seguridad y los rechazos de métodos no admitidos.
- Normalizar el exceso de cuerpo a 413. No registrar el cuerpo de estas
  solicitudes. Acotar concurrencia y reintentos para no acumular varios buffers
  de 7 MiB por usuario. Un tamaño válido en el frontend no sustituye estos límites.

## Operaciones HTTP previstas

Estas rutas son un contrato futuro: no agregarlas manualmente a OpenAPI como si
ya funcionaran. Generar DTO/OpenAPI y tipos web al implementarlas.

| Método y ruta, prefijo /api/v1 | Permiso y resultado |
| --- | --- |
| PUT `/tickets/{ticketId}/attachment` | `tickets:create`, sesión del titular: 201 al adjuntar; 200 al repetir el mismo contenido |
| GET `/tickets/{ticketId}/attachment` | `tickets:read:self`, sesión del titular: metadatos del adjunto disponible |
| GET `/tickets/{ticketId}/attachment/content` | `tickets:read:self`, sesión del titular: bytes como descarga |

En las tres rutas: buscar el ticket por UUID, titular e institución derivados de
la sesión. Ticket ajeno o inexistente produce el mismo 404, antes de consultar
objetos. No aceptar ownerId, institutionId, bucket, storageKey o prioridad.
El rol administrador no obtiene acceso implícito a adjuntos personales.

PUT conserva cookie HttpOnly, Origin esperado, `Content-Type: application/json`
y `X-CSRF-Token`. Cuerpo exacto:

```json
{
  "originalName": "captura.png",
  "mimeType": "image/png",
  "contentBase64": "BASE64_CANONICO_DEL_ARCHIVO"
}
```

Validar firma y estructura del archivo con un detector/parser mantenido, además
de la extensión y el MIME; los tres deben ser coherentes (jpg/jpeg equivalentes).
Rechazar contenido truncado, inválido o que no pueda validarse con límites de
recursos. Sanear originalName: nombre base sin rutas, controles o CR/LF, longitud
máxima 255 caracteres. Calcular sizeBytes y SHA-256 sobre los bytes reales en
el servidor. La validación de formato no se presenta como análisis antivirus.

Respuesta 201/200 y GET de metadatos: `{id, ticketId, originalName, mimeType,
sizeBytes, sha256, createdAt}`. No incluir contentBase64 ni claves de objeto.
Archivo ausente: 404 `ATTACHMENT_NOT_FOUND`; Storage inaccesible o metadatos sin
objeto: 503 `DEPENDENCY_UNAVAILABLE`, sin marcar disponible un archivo perdido.

Descarga con `Content-Disposition: attachment` y nombre escapado correctamente,
MIME validado, `X-Content-Type-Options: nosniff` y `Cache-Control: no-store`.
No renderizar PDF/HTML del usuario dentro del origen de CampusITSM. También
conservar no-store en metadatos, carga y errores autenticados.

Otros errores: 400 `VALIDATION_ERROR`; 401 `SESSION_REQUIRED`; 403 `FORBIDDEN`
o `WRITE_PROTECTION_REQUIRED`; 409 `ATTACHMENT_ALREADY_EXISTS`; 413
`FILE_TOO_LARGE`; 415 `UNSUPPORTED_FILE_TYPE`; 503 `DEPENDENCY_UNAVAILABLE`.

## Registro y reintentos independientes del ticket

1. Crear el ticket usando la Idempotency-Key actual. Conservar su respuesta y
   código aunque falle después el archivo. Sin archivo, el reporte termina aquí.
2. Si se eligió un archivo, enviar PUT al ticket ya creado. Ante fallo de red,
   reintentar ese PUT; no crear otro ticket ni regenerar su clave de creación.
3. PUT es idempotente por el único espacio de adjunto del ticket: comparar
   SHA-256, tamaño, MIME y nombre saneado. Si coinciden, devolver 200 con los
   mismos metadatos; si difieren, 409 sin reemplazar el archivo existente.
   No hace falta reutilizar la Idempotency-Key de creación ni agregar una tabla
   paralela de reintentos; la unicidad de ticketId decide la concurrencia.
4. Serializar altas del mismo ticket mediante bloqueo de fila en PostgreSQL,
   efectivo entre instalaciones, y tiempos de espera acotados. Una petición
   concurrente no debe producir dos filas ni reemplazar el objeto del ganador.
5. Subir un objeto nuevo con clave exclusiva del intento y comprobar éxito antes
   de confirmar metadatos. Una fila confirmada debe referir un objeto real.
   No existe una transacción atómica entre PostgreSQL y Storage: contemplar fallo
   de red, rollback y caída del proceso después de la carga.
6. Si falla antes de confirmar metadatos, compensar únicamente el objeto temporal
   creado por ese intento y sin referencia confirmada. Ante resultado incierto
   de COMMIT, comprobar la fila desde una conexión nueva antes de borrar nada.
   Nunca borrar un objeto enlazado ni una evidencia preexistente. Para caída del
   proceso, dejar una reconciliación explícita que detecte candidatos sin referencia
   con antigüedad suficiente y sin cargas activas; su limpieza se registra y no
   se confunde con borrar evidencia del usuario. No crear un borrado masivo al arrancar.
7. En P03/P04 mostrar por separado «reporte registrado» y «evidencia pendiente /
   adjuntada / no se pudo adjuntar», con reintento del archivo. No afirmar que el
   reporte completo falló si el ticket ya fue guardado.

## Migración y criterios de aceptación

Conservar `TicketAttachment` y añadir el máximo de tamaño mediante **otra
migración Prisma**, después de la inicial de Johan. No editar migraciones
aplicadas. Revisar también los índices indicados en
[REVISION_MIGRACION_TICKETS.md](REVISION_MIGRACION_TICKETS.md).
No escribir SQL de negocio en storage.objects ni agregar bytes al esquema Prisma.

Antes de declarar el flujo implementado, Johan comprobará:

- PNG/JPEG/PDF válidos, vacío, 5 MiB exactos, un byte más, Base64 inválido,
  MIME/extensión/firma incompatibles y cuerpos que exceden el parser/proxy.
- Sesión ausente/vencida, falta de CSRF, Origin ajeno, otra cuenta y otra
  institución; mismo 404 para ticket ajeno/inexistente y ninguna clave expuesta.
- Dos PUT simultáneos desde instalaciones distintas; reintento tras respuesta
  perdida y después de reiniciar; mismo archivo sin duplicado y distinto con 409.
- Fallo de Storage, fallo de INSERT/COMMIT y objeto ausente; no metadatos falsos,
  no eliminación de objetos de otros intentos y recuperación del reporte guardado.
- Archivo subido desde una computadora y descargado por su titular desde otra;
  acceso denegado a otras cuentas y revocación tras desactivar al titular.
- Inicio, acceso directo, listado y descarga del bucket denegados a clientes
  públicos/usuarios que omitan NestJS, aun conociendo una clave de objeto de prueba.

Estas son pruebas requeridas para la implementación futura; no se ejecutaron
como parte de la revisión de migración ni acreditan un bucket ya habilitado.

## Reparto y habilitación pendiente

Roberto coordina la habilitación del bucket y la entrega privada de la credencial
de servidor, comprueba sus políticas y registra el cambio de infraestructura.
Johan incorpora este contrato, implementa y valida el flujo completo en su rama.
Jasmine consume solo datos mínimos autorizados cuando se acuerde su integración.
Nadie crea otro login, catálogo académico ni servicio de auditoría.

Para habilitar el almacenamiento recomendado todavía falta autorizar acceso del
conector a CampusITSM o ejecutar su preparación desde una sesión propietaria
autorizada. El rol PostgreSQL de API no administra Storage y no sustituye esa
credencial. No se creó un bucket, contrataron recursos o aplicaron cambios remotos
durante esta revisión. La integración en main requiere autorización de Roberto.

Fuentes oficiales consultadas el 11 de noviembre de 2026:
[buckets privados](https://supabase.com/docs/guides/storage/buckets/fundamentals),
[límites por bucket](https://supabase.com/docs/guides/storage/buckets/creating-buckets),
[acceso y claves de servidor](https://supabase.com/docs/guides/storage/security/access-control),
[carga estándar y no sobrescritura](https://supabase.com/docs/guides/storage/uploads/standard-uploads).
