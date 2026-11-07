# Roberto — semana 1, calendario manual en revisión

Actualización visual posterior solicitada por Roberto: la referencia vigente del
acabado y componentes es `casos-gestion`. Ver
[adaptación y capturas nuevas](roberto-calendario-diseno-casos-gestion.md).
Las capturas de esta entrega conservan la revisión visual anterior.

Fecha: 6 de noviembre de 2026. Rama: `calendario-academico`.
Base utilizada: `196a2144aae253ca672eeeaf721c62204516245a` de `origin/main`.
**No integrado en main. Roberto debe autorizar expresamente esa integración.**
Commit de código: `a41073e19eee32a049d97def5fd3dd982046df16`.
PR: [#2, en borrador](https://github.com/RobertoC1006/proyecto-gestion/pull/2),
sin autorización de integración en main.

## Terminado en esta rama

- Migración nueva y versionada, sin editar la migración inicial. Cursos, secciones,
  asociaciones de sujetos validados y eventos manuales con tres alcances.
- API NestJS: creación/listado de cursos y secciones, alta/baja de asociaciones,
  CRUD de eventos, filtros/paginación y consulta personal. Validación de fechas,
  pertenencia del curso/sección, motivo obligatorio y versiones contra cambios perdidos.
- Restricciones PostgreSQL para fechas, alcance, fuente, códigos y relaciones
  compuestas que impiden cruzar instituciones/cursos/secciones.
- Escritura transaccional de antes/después/actor/motivo en `AcademicChange` para
  futura integración de auditoría; una falla del registro revierte el evento.
- P17: semana navegable, filtros curso/sección/fuente, agenda, selección y detalle,
  edición, eliminación con motivo, estados de carga/error/vacío y actualización.
- P18: creación/edición manual, alta de curso/sección desde el formulario,
  vista previa, error de fin anterior al inicio, motivo y guardado vía API.
- Horas capturadas/mostradas en Lima y guardadas UTC; sin cálculo paralelo de prioridad.
- OpenAPI exportado y tipos de frontend generados a partir de él. React Router y
  TanStack Query para rutas/estado de servidor, sin datos de negocio en localStorage.
- Se adaptaron los mismos Sidebar/AppHeader y controles al diseño verde/menta
  de los mockups; no se creó otra familia paralela. Diálogo compartido accesible.

## Dependencias y límites reales

**No se ha completado el recorrido autenticado de la semana 1.** Jasmine aún no
entregó identidad/permisos/directorio/auditoría y Johan no tiene rama de componentes
o tickets. Roberto lo confirmó en el chat y pidió empezar los componentes del
calendario con el mockup final, descartando la vista provisional como diseño.

El adaptador de identidad predeterminado deniega acceso académico (401).
`AcademicIdentity` y `AcademicDirectory` deben conectarse al módulo de Jasmine;
el servidor comprobará sesión, administrador, institución y protección de escritura.
Hasta entonces, el navegador permite inspeccionar el diseño pero no leer/guardar
eventos reales. No hay contraseña de demostración ni atajo de rol para eludirlo.

Las pruebas de integración usan un adaptador de identidad solo dentro del proceso
de pruebas, sobre PostgreSQL real. Las pruebas de interfaz interceptan respuestas
con fixtures. Esto no acredita login ni un recorrido navegador→API autenticada real.
El código de pruebas no se copia a la imagen de ejecución normal.

Las asociaciones guardan una referencia opaca al sujeto de identidad, validada por
directorio al crearlas; no se implementó una segunda tabla de usuarios. La FK hacia
identidad, altas/bajas/cambios de institución y la retención/entrega de `AcademicChange`
deben acordarse con Jasmine. Al integrar sesiones, limpiar también QueryClient en
login/logout para evitar reutilizar consultas de otra cuenta.

Se conserva `front-vistas`; no se modificaron ni borraron ramas de compañeros.
Los cambios compartidos de cabecera/navegación/control de diálogo quedan para
revisión de Johan y el contrato de identidad/auditoría para Jasmine.

CSV, importación, P19, factores/SLA y cálculo del factor son semana 2. IA,
pronóstico y notificaciones no se implementan en esta entrega. Los controles de
importación aparecen deshabilitados; Actualizar vuelve a consultar esta API y no
afirma una conexión institucional.

## Pruebas ejecutadas

- TypeScript y construcción Vite/NestJS correctos, Prisma generado y migraciones
  aplicadas únicamente en proyectos Docker de prueba/revisión independientes.
- Siete escenarios de integración PostgreSQL: guardia cerrada; permisos/CSRF;
  cursos/secciones/asociaciones; fechas/alcance; escritura UTC y reversión si falla
  registro de cambios; contexto personal e institucional/paginación; ediciones
  simultáneas, eliminación/versiones y restricciones directas de PostgreSQL.
- Persistencia: proyecto `campusitsm-calendar-check-20261106165619` correcto;
  evento conservado tras `down` y `up` sin borrar volúmenes. Contenedores de prueba
  retirados, volúmenes conservados; no afectó datos habituales de la base anterior.
- Cinco pruebas Playwright correctas: semana/detalle/fuente/navegación, formulario
  inválido/UTC, edición/conflicto/eliminación, 401 real y móvil sin desbordamiento.
- Dependencias bloqueadas: revisión npm sin alertas para API y web.
- Modo desarrollo correcto en `campusitsm-calendar-dev`, puerto 18084; contratos
  de cuerpo y filtros conservados. La recarga usa TypeScript con metadatos de
  NestJS. Contenedores de esa prueba retirados, conservando volúmenes.
- Clon limpio del commit anterior: construcción web y verificación completa API/
  PostgreSQL/persistencia correctas en `campusitsm-calendar-check-clean-20261106`,
  sin archivos del host ni cambios sin versionar. Contenedores de prueba retirados.

## Capturas y comparación visual

Referencia: [lámina 5](../../diseno/campusitsm/05_cu03_calendario_configuracion.png),
P17 arriba izquierda y P18 arriba derecha; P19/P20 no son parte de este avance.

Capturas revisadas visualmente, escritorio 1440 × 900 y móvil 390 × 844 (móvil con
captura completa para inspeccionar contenido por debajo del primer viewport):

- [P17 escritorio, fixture](capturas/calendario/p17-escritorio-fixture.png).
- [P18 escritorio, fixture](capturas/calendario/p18-escritorio-fixture.png).
- [P17 móvil, fixture](capturas/calendario/p17-movil-fixture.png).
- [P18 móvil, fixture](capturas/calendario/p18-movil-fixture.png).
- [P18 estado real sin sesión](capturas/calendario/p18-acceso-real-pendiente.png).

Se conservaron menú/cabecera, banner con calendario, paleta, filtros izquierdos,
grilla semanal/detalle y formulario/vista previa. No se acredita fidelidad píxel a
píxel: ilustración e isotipo están resueltos con los componentes/iconos actuales;
se añadieron título/motivo/edición y alta de catálogos para funcionar. No se copió
la importación de ejemplo ni el factor 2.0 ficticio. La hora se coloca según el dato
real (sin reproducir el ejemplo que muestra 23:59 en una celda de la tarde).
En móvil se muestra agenda legible y filtros apilados, sin inventar otro tema.
Los controles nativos de fecha/hora siguen el formato del navegador; la vista
previa muestra la fecha en español y la zona de Lima.

## Reproducir y siguiente paso

En esta rama, para la revisión separada de main:

```powershell
$env:WEB_PORT = '18083'
docker compose -p campusitsm-calendar-review up --build
```

Abrir `http://localhost:18083/admin/calendario` y `/admin/calendario/nuevo`.
Es normal recibir aviso de sesión requerida; no usar el login provisional como
prueba de autorización. Pruebas reproducibles en `scripts/verify-calendar.ps1`
y `apps/web/test/academic.spec.cjs`, con instrucciones en README.

La siguiente integración necesaria es el adaptador de identidad/directorio y
auditoría de Jasmine, más revisión de componentes/consumo de contexto con Johan.
No integrar esta rama, borrarla ni empezar semana 2 automáticamente.
