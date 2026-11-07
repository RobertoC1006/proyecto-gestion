# Coordinación de cambios en la base compartida

Registro del equipo, no sustituto del historial de migraciones Prisma ni de la
auditoría de aplicación. Aplicar el procedimiento de
[COORDINACION_SUPABASE.md](COORDINACION_SUPABASE.md).

Al 7 de noviembre de 2026 el traslado de negocio y la habilitación compartida
siguen pendientes. No se registran como remotas aplicadas las migraciones que
solo se ejecutaron en PostgreSQL local o en pruebas. Consultar destino e historial
reales antes de aplicar una migración.

| Fecha | Responsable / módulo | Rama y commit | Archivo de migración | Tablas / índice / contratos afectados | Entorno de destino | Autorización de Roberto / ejecutor | Estado y verificación |
| --- | --- | --- | --- | --- | --- | --- | --- |

Estados: propuesto, validado localmente, autorizado, aplicado, verificado o requiere
corrección. Cada entrada debe explicar brevemente la compatibilidad con los otros
módulos, pruebas, respaldo cuando corresponda y dependencia que deben recibir los
compañeros. No anotar secretos, URLs con credenciales ni datos personales.

No completar una fila como aplicado/verificado por el hecho de aprobar un plan
o crear un archivo SQL. Si una migración ya se aplicó, conservar su archivo exacto;
un cambio posterior requiere otra migración y otra entrada.
