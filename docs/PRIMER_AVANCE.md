# Primer avance — prioridades acordadas con Roberto

11 de noviembre de 2026. Roberto prioriza los módulos centrales de la presentación
y pospone los adjuntos por considerarlos innecesarios en este momento.
Esta organización describe un corte funcional del proyecto; no sustituye una
rúbrica del docente ni declara completada toda la semana 1 original.

## Objetivo de la demostración

Entrar con una cuenta real, registrar una incidencia sin archivo, recibir su
código, volver a consultarla y comprobar que otro usuario no puede acceder.
Mostrar además el calendario académico y la administración básica que esté
validada. Presentar cada estado real: registrado, clasificación pendiente y
prioridad aún no calculada cuando corresponda.

## Prioridades y estado comprobado

| Prioridad | Módulo | Responsable | Situación y trabajo para el corte |
| --- | --- | --- | --- |
| 1 | P01: acceso y permisos reales | Roberto | Publicado en main; usar la identidad existente y probar cuentas con roles distintos |
| 1 | P03/P04: registrar y recibir código | Johan | Núcleo en gestion-incidencias; conectar cursos propios, conservar General sin curso y registrar sin evidencia |
| 1 | P05: listado y detalle personal | Johan | Comprobar persistencia, filtros, reintentos sin duplicados y acceso solo del titular con API real |
| 1 | Base compartida y funcionamiento conjunto | Roberto y Johan | Revisión de migración favorable; aplicar el núcleo con el procedimiento manual, registrar y verificar; integrar código en main cuando Roberto lo autorice |
| 2 | P17/P18: calendario manual | Roberto | Publicado en main; demostrar evento guardado y cursos/secciones propios. Sin CSV ni factor académico calculado en este corte |
| 2 | P20: administración básica de usuarios | Jasmine | Avance en administracion-usuarios; revisar y validar antes de integrarlo o presentarlo como terminado. Reutilizar permisos comunes |

Los cambios de rol/estado de la base de identidad ya existen; el formulario de
Jasmine no es requisito para comenzar el flujo personal de incidencias. No
suplantar usuarios ni asignar administradores automáticamente para demostrarlo.

## Reparto inmediato

- **Roberto:** coordinar que el núcleo de tickets pueda utilizarse en la base
  compartida y que el código integrado corresponda a su historial; revisar
  administración de Jasmine y verificar acceso/calendario con el flujo conjunto.
- **Johan:** incorporar main, conectar el selector académico y terminar el
  recorrido de creación/listado/detalle sin archivos. No esperar al bucket.
- **Jasmine:** cerrar administración básica y sus comprobaciones de permisos;
  mantener la coordinación de consentimiento/auditoría de su módulo. No ampliar
  el alcance a reportes o constancias para eludir una dependencia de tickets.

Esta priorización no inicia automáticamente otra semana ni aplica migraciones.
La delegación de cambios ordinarios de cada módulo y la autorización de Roberto
para integrar en main conservan las reglas de AGENTS.md.

## Pospuesto para una entrega posterior

- Adjuntos, carga/descarga de evidencia, creación de bucket y entrega de secretos
  de Storage. Su contrato se conserva como referencia, sin bloquear este corte.
- CSV de calendario, clasificación IA, predicción, alertas y reportes avanzados.
- Emisión/verificación de constancias PDF, que es un módulo distinto de adjuntar
  evidencia y depende de tickets resueltos con falla confirmada.

Cola/atención/resolución y prioridad manual serán el siguiente bloque funcional
a priorizar; requieren coordinación del calendario/factor/configuración de
Roberto con incidencias de Johan. No se presentan como ya implementadas.
Se conserva el alcance final del proyecto; no se elimina una función por diferirla.

## Criterios de aceptación del corte

1. Inicio de sesión con una cuenta real activa y permisos del servidor.
2. Reporte General válido y reporte Curso con las asociaciones autorizadas;
   ningún archivo es obligatorio ni aparece falsamente como cargado.
3. Código visible, confirmación de registro y estado de clasificación pendiente.
4. El ticket persiste al actualizar y reiniciar; un reintento no lo duplica.
5. Listado/detalle propios; otra cuenta obtiene el mismo 404 que un ticket inexistente.
6. Evento académico guardado en el calendario manual y acceso administrativo
   coherente con permisos; P20 solo se acredita tras su validación conjunta.

No marcar este corte como terminado por disponer de pantallas o pruebas con
respuestas sustituidas. Falta comprobar la integración real. Las comprobaciones
de archivos se retoman cuando se reactive ese alcance.
