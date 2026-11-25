# Integración de entregas del equipo — 24 de noviembre de 2026

Estado: validación automática y migraciones completadas; recorrido con cuentas
reales y publicación pendientes. Código funcional probado: `00eb7a2a943be3e44b343d2b438987a31f7b33be`.
La autorización de Roberto para corregir, integrar y publicar sigue vigente,
condicionada a completar satisfactoriamente ese recorrido.

## Git y paquete

- `git fetch origin` y `git ls-remote --heads origin` verificaron main
  `d8ef0caf1d611b04fd70bb6d9ffab91688556153` y las ramas actuales del equipo.
- `git bundle verify outputs/revision-equipo-20261124/CampusITSM_integracion.bundle`
  aprobó el paquete. Importado con fetch a `integracion-avances-equipo` y HEAD
  inicial exacto `fb3cd26827ae7a335729f3ca7fd32bc7f76afb98`.
- `622c43b` Johan; `7becc12` constancias, `4ae4b6b` privacidad y `750bf86`
  reportes de Jasmine, además de Usuarios `7ab1ed7` y main, son ancestros del
  candidato. No hay entregas remotas posteriores que incorporar.
- El parche `CampusITSM_correcciones_9294147.patch` ya estaba contenido y no
  se aplicó de nuevo. Historias de autores, worktrees y ramas conservados.
  `outputs/` ya estaba sin seguimiento al iniciar y se mantuvo fuera del commit.
- Revisión de todos los worktrees registrados: se conserva un cambio previo
  ajeno en `fix/johan-contadores:odd/tasks/integration-readiness.md`; los demás
  worktrees están limpios. No se modificó ninguno.
- El entorno permite Git y Docker con elevación por operación. El acceso de
  escritura a GitHub se comprobó mediante `git push --dry-run` a la rama de
  integración: aceptado, sin crear rama remota ni publicar main. No se imprimieron
  credenciales ni fue necesario abrir el Administrador de credenciales.

## Correcciones posteriores al bundle

- Auditoría agrega las emisiones y verificaciones persistidas de constancias a
  las cinco fuentes existentes, sin duplicar eventos al reintentar una emisión.
  La verificación pública tiene actorId nulo y etiqueta Consulta pública; no
  suplanta al titular. El contrato OpenAPI y el tipo web admiten ese valor.
- Filtros de Auditoría para constancias, corrección de servicio, asignación y
  evaluación. Se mantienen permisos efectivos e institución en consulta/CSV.
- Reportes convierte el intervalo de fechas de Lima a instantes UTC y agrupa
  por día/semana/mes de Lima. Consulta y CSV comparten parámetros/selección.
  No se implementó un pronóstico alternativo.
- Se adaptaron dos expectativas antiguas de navegación a Mis incidencias,
  Constancias y Privacidad. Sin capacidades, solo Dashboard/Privacidad.
- Override Effect 3.21.4 → 3.22.1 y lockfile: corrige el aviso
  [GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw).
  Prisma permanece en 6.19.3; sin actualización forzada de dependencias.

## PostgreSQL y API

Imagen final `campusitsm-workflow-test:local`, construida con el Dockerfile y
target test del repositorio; Prisma generado y TypeScript compilado.

```powershell
docker build --target test -t campusitsm-workflow-test:local -f apps/api/Dockerfile .
python scripts/verify-workflow.py --tests test/connection.test.cjs test/auth.test.cjs test/auth.provider.test.cjs test/role-permissions.test.cjs test/users.test.cjs test/academic.test.cjs test/tickets.test.cjs test/workflow.test.cjs test/certificates.test.cjs test/certificates.upload.test.cjs test/certificates.http.test.cjs test/certificates.integrity.test.cjs test/privacy.test.cjs test/audit.lifecycle.test.cjs test/audit.snapshot.test.cjs test/reports.test.cjs test/reports.http.test.cjs test/integration.test.cjs
```

Resultado final: **120 tests aprobados**, cero fallidos, omitidos o cancelados;
18 archivos. PostgreSQL 17 real con doce migraciones, DB `workflow_test` en
tmpfs/red interna única, recursos retirados en finally. El runner no lee .env.
AuthProvider/identidad son sustituidos por fixtures: no equivale a autenticación
real de Supabase. Registro local: `.local/integration-api-validation-final.log`.

Incluye alcance personal e institucional, filtros activos/resueltos, prioridad
contextual/calendario, responsable, reclassify con motivo y versiones, SLA,
consentimiento idempotente, exportación completa/snapshot/cursor de auditoría,
solicitudes simultáneas de constancia, SHA256 real y mismos bytes tras reintentos,
archivo ausente/corrupto sin regeneración ni cambio de huella, consulta pública
mínima, original frente a alterado, tamaño de 5 MiB y permisos de reportes.
La prueba integrada verifica emisión/verificación en Auditoría, CSV, filtros
de actor y aislamiento sin atribuir consultas públicas a usuarios reales.

Una ejecución previa de 119 tests pasó antes de agregar la frontera horaria de
reportes. La primera prueba mensual usaba inicio UTC (31 de octubre en Lima);
se ajustó el fixture al intervalo local de noviembre. Después pasaron las 14
pruebas afectadas y la suite final de 120 sobre la dependencia corregida.

## Navegador

```powershell
# Desde apps/web, después de reconstruir y comprobar salud:
node node_modules/@playwright/test/cli.js test
```

Resultado final: **54 aprobados**, sin omisiones; escritorio y móvil. Registro
local: `.local/integration-browser-validation-final.log`. Se conservaron límites
por permisos, filtros locales y errores de CSV/descarga/verificación; prueba
de reportes compara fechas/selección de consulta y exportación. Los recorridos
usan respuestas de prueba y contextos nuevos, sin cookies de cuentas reales.
Las capturas de calendario generadas por la suite no se incorporaron al commit.

Primer intento sin elevación no conectó a localhost y se interrumpió. Con acceso
del entorno, se detectaron dos expectativas antiguas de navegación, corregidas
y revalidadas antes de la ejecución final conjunta verde.

## Supabase

Conector: sigue sin permiso para la organización CampusITSM. Se utilizó la
conexión documentada del servidor, sin imprimir secretos ni acceder al almacén
de credenciales. Consultas de metadatos en transacción READ ONLY.

Antes: diez migraciones exactas; consentimiento/constancias ausentes. Aplicadas
solo esas dos mediante la credencial migradora documentada, tras PostgreSQL
aislado. Después: doce huellas exactas, TLS y rol/esquema correctos, RLS en las
cuatro tablas, API sin actualización/borrado de aceptaciones/verificaciones,
historial Prisma solo lectura y anon/authenticated sin acceso a esas tablas.
Archivos, hashes, ejecutor y tiempos: [REGISTRO_CAMBIOS_BD](../REGISTRO_CAMBIOS_BD.md).
Una reversión de código no revierte estas migraciones.

## Instalación habitual

`docker compose up --build -d --wait` desde la rama de integración aprobó.
API, web y predictions saludables; `/api/v1/health` devuelve status/database/
predictions ok. El índice servido en localhost:8080 coincide con el dist de
la web compilada. `docker ps` muestra solo esos tres servicios de CampusITSM;
la base local histórica se detuvo con su volumen conservado. Sin aplicaciones
de revisión adicionales, cambios de claves, reset, db push ni seed remoto.
`npm audit --json` de API después del ajuste de Effect: cero avisos.
El SHA256 del lockfile dentro de la API servida coincide con el archivo local
del commit: `af29bee18c8aa3046890834ecbd2c74328d6cf40e2cbe47681809ab614596e38`;
la dependencia instalada dentro del contenedor es Effect 3.22.1.

Consulta anónima de conteos: cuatro tickets isDemo, uno resuelto con falla
confirmada; cero constancias; cero versiones de consentimiento. No se cargó
una política inventada ni se modificaron cuentas para simular el recorrido.

## Continuación necesaria antes de main

El intento de control de pantalla de Windows se interrumpió porque la herramienta
no pudo verificar la URL de la ventana con suficiente confianza. La pestaña del
navegador integrado alcanzó la comprobación de sesión; no se verificó un login.
Roberto debe abrir localhost:8080 e iniciar sesión personalmente como administrador.

1. Revalidar Git/remoto sin alterar las ramas de compañeros. La autorización de
   merge/push ya está dada; no solicitarla nuevamente por rutina.
2. Administrador: revisar la cola DEMO, orden contextual/técnico, responsable;
   corregir servicio con motivo, asignar, atender y resolver un caso DEMO abierto.
   Conservar plazos e historial, confirmar la falla expresamente en la simulación.
3. Roberto cambia personalmente a estudiante titular; comprobar conteos/filtros,
   seguimiento y solicitar la constancia de su caso DEMO elegible. Descargar PDF,
   repetir solicitud/descarga y contrastar SHA256/bytes con la emisión.
4. Consultar código público sin sesión; comprobar PDF original y copia alterada
   sin tocar el archivo almacenado. Verificar también errores de carga.
5. Roberto cambia personalmente a administrador; comprobar emisión/verificaciones
   y acciones del ticket en Auditoría/CSV y reportes filtrados de demostración.
   Privacidad debe mostrar que aún no hay una política vigente publicada.
6. Registrar resultados reales y corregir defectos reproducibles. Tras el recorrido
   satisfactorio: integrar conservando historia, push normal a main, comprobar SHA
   remoto, reconstruir desde main y verificar salud/archivo web servido.

Pendientes de alcance más amplio: publicación de política de consentimiento y
preparación analítica, pronóstico de Roberto, vista previa/campos adicionales del
PDF según plan y URL QR accesible desde teléfono. No se declaran terminados.
Esta entrega conserva la aplicación en el candidato, main en `d8ef0ca` y la
autorización de publicación pendiente de completar el recorrido solicitado.
