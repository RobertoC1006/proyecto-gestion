# Roberto — cursos y secciones propios para incidencias

11 de noviembre de 2026. Alcance autorizado: punto 1 para desbloquear el selector
académico de Johan. No inicia el resto de semana 2.

- Responsable: Roberto.
- Rama: `cursos-propios`, creada desde main/origin/main
  `69a6907fb0b8ecf5fd5148e584aabb37c05b8895` tras consultar GitHub.
- Código disponible en la rama de trabajo; publicación e integración en main
  pendientes. No se modificaron las ramas de los compañeros.
- Johan: `gestion-incidencias@90a2790fe0dd644b7170410103476e71e21ac259`;
  Jasmine: `administracion-usuarios@15ef96ba54cf3fe4bbd712efb8e3de3e4431c94c`.
  Revisadas para comprobar dependencias y evitar duplicar modelos.

## Terminado

- GET `/api/v1/academic/me/courses`: cursos con asociaciones del titular en su
  institución, sin duplicados por múltiples secciones.
- GET `/api/v1/academic/me/sections?courseId=…`: únicamente secciones propias
  de ese curso, con curso UUID obligatorio y paginación validada.
- Identidad e institución derivadas de la sesión común; sin posibilidad de elegir
  otro titular por parámetros. No se abren los catálogos administrativos.
- Lista vacía para cuentas sin asociaciones o secciones de un curso no visible;
  respuestas sin datos personales de integrantes y con `Cache-Control: no-store`.
- OpenAPI y tipos web regenerados. Se conservan las tablas, índices y el historial
  de migraciones existentes: este cambio no requiere migrar Supabase.
- [Contrato de consumo para Johan](../CONTRATO_CURSOS_PROPIOS.md), con parámetros,
  errores, paginación y ejemplo que reutiliza el cliente web existente.

## Verificación

- Compilación TypeScript de la API y generación de OpenAPI aprobadas.
- Generación de tipos del navegador y comprobación TypeScript web aprobadas.
- `scripts/verify-auth.ps1`: 29 pruebas aprobadas, 0 fallos. PostgreSQL descartable,
  proveedor externo sustituido exclusivamente dentro de los tests; solicitudes
  HTTP y sesiones reales de la aplicación.
- Nuevos casos: autenticación; estudiante/docente; aislamiento entre titulares,
  secciones e instituciones; deduplicación/paginación; listas vacías; retiro de
  asociaciones; parámetros/UUID inválidos; cuenta desactivada.
- Los recursos del proyecto de pruebas fueron cerrados y retirados al terminar.
  No se escribieron datos de prueba en Supabase ni se ejecutó su migrador.
- El conector sigue sin permiso sobre CampusITSM; no fue necesario para esta
  ampliación de lectura. Las pruebas usan PostgreSQL aislado y la instalación
  de trabajo conserva su conexión privada existente.
- Instalación habitual actualizada con `docker compose up -d --no-build --wait api`.
  Salud integral 200 (`database: ok`, `predictions: ok`); nuevas rutas presentes
  en OpenAPI y ambas responden 401 sin sesión. `courseId` figura obligatorio en
  la consulta de secciones. Solo continúan web/api/predictions de campusitsm.

## Disponibilidad y pendientes

La instalación habitual campusitsm:8080 está actualizada desde esta rama para
revisión, con sus volúmenes conservados y las nuevas rutas verificadas. No se
reconstruyó otra aplicación ni se trasladó la base o añadieron permisos de Supabase.

No hay cambios visuales en esta entrega; no se sustituye ni se implementa P03
desde la rama de Roberto. Johan debe obtener la entrega autorizada, actualizar
su aplicación y conectar las consultas, manteniendo General sin curso y sección
opcional cuando elija Curso. No basta reconstruir su versión anterior para que
aparezcan rutas que aún no tiene en Git.

Siguen pendientes almacenamiento/evidencias y revisión de la migración de tickets;
consentimiento y auditoría dependen de Jasmine. La semana 1 conjunta no se marca
como cerrada. No se envió ningún mensaje externo al equipo.
