# Coordinación de cambios en la base compartida

Registro del equipo, no sustituto del historial de migraciones Prisma ni de la
auditoría de aplicación. Aplicar el procedimiento de
[COORDINACION_SUPABASE.md](COORDINACION_SUPABASE.md).

Al 7 de noviembre de 2026 el traslado de negocio y la habilitación compartida
siguen pendientes. No se registran como remotas aplicadas las migraciones que
solo se ejecutaron en PostgreSQL local o en pruebas. Consultar destino e historial
reales antes de aplicar una migración.

| Fecha | Responsable / módulo | Rama y commit | Archivo de migración | Tablas / índice / contratos afectados | Entorno de destino | Alcance delegado o acuerdo común / ejecutor | Estado y verificación |
| --- | --- | --- | --- | --- | --- | --- | --- |

Estados: anunciado, validado localmente, acordado cuando afecte partes comunes, aplicado, verificado o requiere
corrección. Cada entrada debe explicar brevemente la compatibilidad con los otros
módulos, pruebas, respaldo cuando corresponda y dependencia que deben recibir los
compañeros. No anotar secretos, URLs con credenciales ni datos personales.

Para tablas/columnas/índices nuevos del módulo asignado, compatibles y dentro del
plan, basta el alcance delegado por Roberto: no pedirle permiso por cada tabla.
Registrar y avisar no equivale a esperar una aprobación. Consultar previamente
los cambios sobre otros módulos, identidad/permisos comunes o incompatibles.

No completar una fila como aplicado/verificado por el hecho de aprobar un plan
o crear un archivo SQL. Si una migración ya se aplicó, conservar su archivo exacto;
un cambio posterior requiere otra migración y otra entrada.
