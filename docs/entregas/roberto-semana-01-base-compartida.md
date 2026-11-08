# Roberto — Semana 1, base compartida Supabase

**Estado posterior:** identidad y base compartida publicadas en main por
autorización de Roberto del 7 de noviembre de 2026. Los apartados históricos
de pendientes conservan el momento de esta entrega; ver
[publicación integrada](roberto-publicacion-identidad-supabase.md).

Entrega del 7 de noviembre de 2026, solicitada por Roberto. No cierra toda la
semana ni inicia CSV, IA, predicción o módulos de Johan/Jasmine.

**Actualización posterior del mismo día:** proyecto trasladado a organización
gratuita exclusiva CampusITSM; invitaciones Developer enviadas, aceptación pendiente.
El apartado de pendientes de esta entrega conserva el estado previo a esa acción.
Ver [colaboradores](../COLABORADORES_SUPABASE.md) para el estado vigente.

## Código y alcance

- Rama: base-compartida-supabase; implementación `864413a`, desde identidad-supabase@13c6cc7.
- Main remoto comprobado: 02d10f557fdf81af81fdeef1ecf7fb7d210aaeed.
  Origin/main y front-vistas se revisaron al iniciar; fetch realizado. No se
  modificaron ramas ajenas. Identidad/transición siguen sin publicar/integrar.
- Supabase: CampusITSM / organización RobertoC1006 / región sa-east-1 /
  esquema privado campusitsm. Plan gratuito, sin contratar servicios adicionales.
- Docker mantiene una instalación campusitsm en localhost:8080 para web/api/Python.
  PostgreSQL local detenido, volumen intacto; no se eliminó ningún dato de trabajo.

## Cambio entregado

Se separaron arranque y migración remota. La API usa un rol CRUD sin DDL ni acceso
al catálogo de credenciales Auth. El migrador usa otra credencial privada y un
comando manual que verifica destino/rol/esquema/TLS. Al arrancar, la API comprueba
las migraciones de su versión y sus checksum, sin ejecutarlas; permite otras
migraciones adicionales del equipo. Historial Prisma único para negocio.

Se aplicaron seis migraciones en campusitsm. RLS activo en las 12 tablas de negocio,
con política exclusiva para el servidor; sin uso del esquema para anon/authenticated.
No se sobrescribió auth/storage. La API sigue autorizando por institución/rol/objeto.
La Data API no es un acceso paralelo desde React. DTO/rutas/OpenAPI no cambiaron.

Sesiones/PKCE incorporan instanceId derivado de la clave propia de cifrado.
Se conservaron las sesiones de Roberto asignándolas a esa instalación al copiar.
Otras computadoras generan sus claves; no reciben la de Roberto. El cierre de una
sesión no descifra/elimina sesiones ajenas. Cambios globales de acceso/contraseña
invalidan cuando corresponde en la base común.

## Datos y verificación

Respaldo inicial y final (dump, SHA256 y configuración anterior) en .local/backups,
ignorado por Git y excluido de ZIP. Ambos restaurados en PostgreSQL 17 descartable,
sin puertos y con contenedor retirado al terminar. Copia final con escrituras
pausadas; importación completa en una transacción con comprobación de destino vacío
y comparación de conteos y SHA256 del contenido de todas las tablas.

| Tabla | Filas copiadas |
| --- | --- |
| Institution / SupportTeam / AcademicCourse | 1 cada una |
| AcademicSection / AcademicMembership | 0 |
| AcademicEvent | 1 |
| AcademicChange | 2 |
| AppUser / IdentityChange | 1 cada una |
| AuthSession / AuthFlow / AuthThrottle | 2 / 1 / 3 |

- 22 pruebas automáticas pasaron, 0 fallos: dominio académico, identidad, proveedor
  y control de conexiones. Prueba de dos instalaciones con distintas claves:
  mismo usuario/evento, sin descifrar/borrar sesiones/PKCE ajenos. Proveedor
  sustituido exclusivamente en el ejecutable de pruebas PostgreSQL descartables.
- verify-base.ps1: migración explícita, salud, semilla idempotente/restricciones,
  persistencia de DB/archivos/modelos tras recreación y fallo/recuperación de Python.
  Contenedores de prueba cerrados; no queda aplicación adicional de revisión.
- Reconstrucción de la instalación real: salud API/DB/Python ok, seis migraciones
  conservadas; db local sigue detenido y migrate no se inicia automáticamente.
- Navegador real tras el traslado: sesión de Roberto conservada, evento existente
  visible y formulario Crear evento habilitado. No se fabricaron usuarios ni eventos.
- Asesor Supabase: sin hallazgos nuevos sobre las tablas; aviso previo de protección
  contra contraseñas filtradas desactivada, ver
  [documentación](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
  No se cambió de plan ni se alteró la confirmación de correo.

## Pendientes y reproducción

[OPERACION_SUPABASE.md](../OPERACION_SUPABASE.md) contiene el arranque y comando
manual de migración, preparación privada por computadora y precauciones de retorno.
[REGISTRO_CAMBIOS_BD.md](../REGISTRO_CAMBIOS_BD.md) registra archivos/destino/ejecutor.
Actualizados AGENTS, memoria del proyecto, estado, planes y coordinación.

Roberto indicó aplazar las invitaciones hasta tener los correos de Johan/Jasmine.
Quedan pendientes sus accesos/configuración privada y el código publicado/integrado
cuando Roberto lo autorice. Revisar alcance de colaboradores: la organización
contiene otro proyecto; no dar acceso a él ni contratar un plan automáticamente.
También siguen pendientes SMTP externo y los contratos de consentimiento/auditoría
de Jasmine. No se enviaron mensajes al equipo. Archivos y modelos siguen locales.

Cifrado obligatorio activado en Database Settings → Enforce SSL on incoming
connections; reinicio de Supabase completado. Comprobación desde la conexión real
de API: rol campusitsm_api, esquema campusitsm, pg_stat_ssl.ssl=true y seis
migraciones finalizadas. Salud y sesión real recuperadas después del reinicio.
La URL Prisma exige TLS y verifica el certificado con la CA oficial incluida.
