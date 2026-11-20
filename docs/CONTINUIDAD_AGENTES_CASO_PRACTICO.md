# CampusITSM: avances y continuidad para los agentes del equipo

**Corte:** 12 de noviembre de 2026. **Coordinador:** Roberto.

Este aviso explica qué deben reutilizar Johan y Jasmine, qué parte de sus planes
ya recibió avance y qué sigue pendiente. No cambia sus asignaciones ni reescribe
sus planes. Los apartados antiguos que dicen «pendiente de integrar main» conservan
el estado de su fecha; esta entrega actualiza ese punto.

## 1. Entrega que deben recibir

- **Canal compartido:** `origin/main`, tras la integración autorizada por Roberto.
- **Commit de integración:** `eccd4650ad6b77273802df17ba56b338dbdb5022`.
- **Código funcional de referencia:** `1e82d84b4674d237d6a4aabfc186bc394eb979b7`,
  de la rama `flujo-caso-practico`; implementación inicial `48b78d8`.
- **Historia conservada:** incluye el núcleo de Johan
  `gestion-incidencias@1667778`, sin rehacerlo ni atribuírselo a Roberto.
- **P20 anterior:** administración de Jasmine `7ab1ed7`, con la corrección de
  Roberto `8350650`, ya integrada anteriormente en main `4855a10`.
- Se conservan las ramas activas de los compañeros. Esta entrega no integra
  `privacidad-auditoria` ni `constancias-verificables`.

Antes de empezar, comprobar la integración publicada y conservar el trabajo de
la rama propia. Desde esa rama, una vez guardados sus cambios:

```bash
git status
git fetch origin
git merge-base --is-ancestor eccd4650ad6b77273802df17ba56b338dbdb5022 origin/main
git merge origin/main
```

La comprobación `merge-base` debe terminar con código 0 antes de continuar. Si
hay conflictos, resolverlos preservando ambos trabajos y los contratos actuales.
No usar `reset --hard`, publicación forzada ni borrar ramas activas para sincronizar.
Si aún no existe una rama propia, actualizar main y crear la del módulo autorizado.

Después, reconstruir la instalación habitual con
`docker compose up --build -d --wait`. El proceso genera el cliente Prisma de su
esquema. Una sola instalación `campusitsm` por computadora en
`http://localhost:8080`; conservar configuración privada, sesiones y volúmenes.
No ejecutar seed, bootstrap, migraciones ni recrear Supabase por recibir este main.

## 2. Qué recorrido funciona

1. El administrador gestiona cursos, secciones y asociaciones de profesores y estudiantes.
2. El profesor programa exámenes o entregas en sus secciones asignadas. No sube
   preguntas, recibe respuestas ni califica: CampusITSM sigue siendo una mesa de ayuda.
3. El estudiante consulta su calendario y puede iniciar un reporte con curso y
   sección precargados. También mantiene el reporte general.
4. El servidor deriva el contexto académico desde calendario y asociaciones;
   guarda su instantánea al registrar/evaluar el ticket. No deduce un examen
   por las palabras del reporte ni calcula prioridad en React.
5. El administrador, que asume TI institucional en este prototipo, consulta la
   cola y compara orden por llegada, técnico y contextual.
6. TI evalúa urgencia/impacto, asigna, inicia atención, registra avances y resuelve
   con solución y confirmación explícita de si hubo falla tecnológica.
7. El titular consulta prioridad, contexto, historial, plazos y solución del
   mismo ticket. El estudiante no recibe las escalas técnicas de operaciones.

**Tres perfiles visibles:** administrador/TI, profesor (`docente` internamente)
y estudiante. Los valores históricos de roles TI permanecen por compatibilidad;
no se ofrecen en el selector ni se borran cuentas para adaptar los perfiles.

La actualización actual consulta cada 15 segundos. No es actualización por
eventos SSE/WebSocket. La primera respuesta se registra con atención humana;
reevaluar no reinicia el reloj del SLA.

## 3. Johan: qué parte de su plan ya avanzó

| Bloque del plan | Qué existe y debe reutilizarse | Qué sigue pendiente |
| --- | --- | --- |
| Semana 1, P02–P05 | Núcleo de Johan: crear, identificar, listar, filtrar, paginar y consultar casos propios. Roberto conectó calendario, curso/sección y el nuevo recorrido. | Revisar todos los criterios y la fidelidad visual. No declarar P02 ni toda la semana cerrados por esta conexión. |
| Semana 1, adjuntos | Existen metadatos del núcleo; el recorrido funciona sin archivos. | Carga/descarga, Storage, tipo/tamaño y autorización. Aplazados expresamente para el primer avance. |
| Semana 2, P06 | Seguimiento con prioridad, contexto, historial, plazos, estados y solución, sin puntaje técnico del estudiante. | Mostrar claramente el responsable asignado en el seguimiento personal. |
| Semana 2, P07 | Cola institucional, filtros/paginación, órdenes contextual/técnico/llegada y desempates estables. | Revisar criterios de aceptación con administrador como TI; no introducir otro modelo de equipos por usar un plan anterior. |
| Semana 2, P08 | Evaluar, asignar, iniciar atención, añadir notas y resolver. Validación de actor, versión y conflictos concurrentes. | Revisión integral de pantalla y criterios finales. El ajuste manual de categoría y servicio todavía falta; ajustar urgencia/impacto no lo sustituye. |
| Semana 2, actualización | Consulta automática y preservación de la versión al comenzar una edición. | Eventos autorizados y pruebas de reconexión, si se mantiene ese requisito. |
| Dependencia de Constancias | Tickets conserva `solution`, `resolvedAt` y `failureConfirmed`, además de su historial. | Contrato interno de lectura autorizado y estable con Jasmine; no duplicar tablas ni conceder lectura indiscriminada. |
| Semana 3, IA | No se incorporó proveedor ni clasificación por IA. | Consultar a Roberto por proveedor antes de implementarlo; luego validación, límites, contingencia, carreras y evaluación con datos autorizados. Sigue aplazada. |
| Semana 4, CU01 | Hay validación aislada del flujo y revisión real de administrador/estudiante. | Recorrido completo del alcance autorizado, errores/reconexión, permisos, escritorio/móvil, accesibilidad y documentación. No se ejecutó toda la suite E2E. |

**No rehacer:** TicketsService, identidad, directorio, asociaciones académicas,
reglas de prioridad, cola y endpoints de operaciones. Ampliar los servicios
existentes y respetar sus transacciones, permisos y controles de versión.

## 4. Jasmine: qué parte de su plan ya avanzó

| Bloque del plan | Qué existe y debe reutilizarse | Qué sigue pendiente |
| --- | --- | --- |
| Semana 1, P20 | Administración de usuarios de Jasmine ya integrada anteriormente; este flujo adapta los tres perfiles visibles y reutiliza el directorio canónico. | Compatibilizar su rama con los perfiles y permisos actuales. No hacer otro login o servicio de usuarios. |
| P21, permisos comunes | Matriz implementada previamente por Roberto a petición expresa; esta entrega añade capacidades de profesor y atención institucional. | Consumir permisos efectivos en cada módulo. Las configuraciones RoleAccess existentes no se sobrescriben automáticamente. |
| Consentimiento/privacidad | Se conserva avance separado en `privacidad-auditoria@c113290`. | Revisar su código vigente, versiones/aceptaciones, permisos y persistencia cuando Roberto retome ese alcance. No empezar de cero ni integrarlo por este aviso. |
| P23, auditoría | Tickets ahora tiene TicketChange; configuración académica/política usa su historial específico. | Integrar auditoría global con filtros, antes/después, exportación autorizada y solo lectura. TicketChange no completa P23. |
| Semana 2, P09 | Tickets aporta solución, resolución y confirmación de falla como insumos. | Elegibilidad centralizada, titular autorizado, solicitud idempotente e instantánea de emisión. «Resuelto» por sí solo no acredita elegibilidad. |
| Semana 2, P10 | No hay emisión real de PDF/QR en este flujo. | PDF real, QR, descarga protegida y hash de los bytes finales. Distinguir el prototipo institucional de una firma legal certificada. |
| Semana 2, P11/P12 | Mockups y vistas iniciales separadas, según la nota de rama siguiente. | Verificación real, datos públicos mínimos con nombre enmascarado, código válido/inválido e integridad de un PDF arbitrario. URL accesible desde el teléfono. |
| Semana 3, P22 | Hay avance separado de privacidad, sin conjunto analítico producido por este recorrido. | Versiones/consentimientos y preparación de datos sin identificadores directos, según la política autorizada. |
| Semana 3, P15 | La cola y los casos cargados demuestran atención, no constituyen Reportes P15. | Consultas reales, filtros, periodos/unidades, categorías, exportación y contrato con analítica de Roberto. Pronóstico aún pendiente. |
| Semana 4, CU02/CU03 | Se conservan las verificaciones previas de usuarios y de la adaptación común. | Permisos cruzados, descargas, concurrencia, alteración de PDF, privacidad, escritorio/móvil y manuales de módulos pendientes. |

**Nuevo avance detectado al preparar esta publicación:**
`constancias-verificables@f15d204` contiene vistas iniciales de «Mis constancias»
y consulta pública. Se revisaron sus cambios: las propias pantallas indican que
no consultan el backend ni emiten PDF y muestran la verificación como pendiente.
No se integró esta rama ni se ejecutó una revisión funcional completa de ella.
Jasmine debe conservarla y conectar allí el servicio, en lugar de reconstruir
sus vistas. Esto actualiza el Excel anterior, que no recogía esa rama recién publicada.

**No rehacer:** Auth, IdentityDirectory, P20, matriz P21 ni Tickets. Coordinar
un contrato de lectura para Constancias y fuentes para Auditoría/Reportes.

## 5. Base común aportada por Roberto

- Calendario/cursos: reutiliza AcademicService y asociaciones. El profesor
  programa solo exámenes/entregas de sus secciones; no eventos institucionales
  ni matrícula. Para curso completo necesita asociación a todas sus secciones.
- P19: contexto/factor desde servidor, reglas de prioridad y SLA versionadas,
  instantáneas de evaluación e historial. No crear un segundo cálculo.
- Preparación explícita de demostración: dos cursos/secciones, actividades y
  cuatro tickets marcados `isDemo`; reintentar no duplica ni reinicia casos.
- Pronósticos, alertas predictivas, proveedor de IA, PDF/QR y adjuntos no se
  implementaron por completar este recorrido.

## 6. Migraciones que ya están aplicadas

Destino compartido: **CampusITSM, esquema `campusitsm`**. Una rama Git no aísla
esta base. Recibir el código no autoriza reaplicar SQL ni borrar datos.

| Migración | Qué aporta | Situación |
| --- | --- | --- |
| `20261108000100_tickets_core` | Núcleo de Johan: Ticket y metadatos TicketAttachment. | Aplicada antes de activar el flujo. |
| `20261113000100_case_workflow` | Estados/campos de atención, evaluación, versión, solución, TicketChange, WorkflowPolicy y autoría de actividades. | Aplicada por autorización específica de Roberto. |
| `20261113000200_workflow_permissions` | Capacidades de profesor y atención institucional; compatibilidad de RoleAccess. | Aplicada por autorización específica de Roberto. |

Archivos exactos en `apps/api/prisma/migrations/<nombre>/migration.sql`.
SHA256 de los SQL, comprobados al preparar el aviso:

```text
20261108000100_tickets_core
d0727f7f1eca862b3fe40da5859493419b98938e076e8c7741cb2466b4b4715a

20261113000100_case_workflow
f106959114bdbf009b0cbd914bcc137ce6385630748d26358c6f40b403baf2bf

20261113000200_workflow_permissions
48407f82abe8f2185a13ec69fb3326aee7771b90aa32723792694112c6147975
```

La aplicación previa verificó diez migraciones con sus checksums. Los clientes
antiguos no se consideran compatibles con `en_atencion`/`resuelto`: incorporar
esquema, generar cliente y reconstruir antes de operar esos casos. No editar
migraciones aplicadas ni crear equivalentes. Los cambios futuros requieren una
migración nueva compatible y el registro de coordinación correspondiente.

Esta publicación no vuelve a migrar ni carga más datos de demostración. Mantener
credenciales, identificadores personales y claves fuera de este aviso.

## 7. Qué está demostrado y qué no

- **Validación funcional previa:** API/web compilan; 58 pruebas aprobadas en
  PostgreSQL descartable, incluyendo identidad, permisos, usuarios, calendario
  y recorrido HTTP. No fueron pruebas destructivas sobre Supabase.
- **Sesiones reales:** administrador y estudiante comprobaron calendario,
  contexto, cola comparativa, atención/resolución y seguimiento del mismo ticket;
  sesión/datos persistieron tras reiniciar la API.
- **Comparación de prioridad:** casos sintéticos 12/P1, 9/P1, 6/P2 y 2/P4;
  orden técnico T2→T1 y contextual T1→T2. No confundirlo con orden por llegada.
- **Profesor:** permisos y programación probados por HTTP aislado. Roberto
  aplazó la sesión con una cuenta Supabase real; esa prueba sigue pendiente.
- **Integración:** se conserva exactamente el código funcional de `1e82d84`.
  Las pruebas previas no se presentan como una nueva ejecución de toda la suite.
- **Comprobación de esta publicación:** API y web recompiladas desde main;
  cliente Prisma generado, tres servicios saludables en la única instalación,
  salud HTTP con base y servicio auxiliar `ok`, página principal HTTP 200 y
  paquete web servido coincidente con la compilación. Sin reaplicar migraciones.
- No se demuestra reducción porcentual de tiempos, precisión de IA ni calidad
  de pronóstico. Los tickets y su solución de demostración están identificados
  como simulados; no acreditan haber reparado una plataforma académica externa.
- Las fechas de las actividades se fijaron al preparar el escenario; no se
  renuevan automáticamente. Para otra exposición, coordinar un nuevo escenario
  sin borrar ni reiniciar el existente.

## 8. Textos listos para pegar

### Para el agente de Johan

```text
Estoy trabajando con Johan en CampusITSM. Primero lee AGENTS.md,
MEMORIA_PROYECTO.md, planes/PLAN_JOHAN.md y el aviso vigente
docs/CONTINUIDAD_AGENTES_CASO_PRACTICO.md, junto con sus contratos y estado
del equipo. Roberto autorizó integrar el flujo en main, conservando el núcleo
de Johan. Verifica que origin/main contenga eccd465 y luego incorpóralo a mi
rama sin descartar trabajo propio. Ya existen contexto académico, prioridad/SLA,
cola TI, evaluación, asignación, atención, resolución y seguimiento. No recrees
Tickets, identidad, reglas ni endpoints paralelos. Hay tres perfiles visibles:
administrador/TI, profesor y estudiante. Las migraciones del aviso ya están
aplicadas en la base común: consume su esquema exacto, no las edites ni dupliques.
Revisa los pendientes de categoría/servicio, responsable visible, actualización
por eventos y contrato con Constancias. IA y adjuntos siguen aplazados. Explica
qué reutilizas y continúa solo la etapa que te indique; no reescribas los planes
por recibir este aviso.
```

### Para el agente de Jasmine

```text
Estoy trabajando con Jasmine en CampusITSM. Primero lee AGENTS.md,
MEMORIA_PROYECTO.md, planes/PLAN_JASMINE.md y el aviso vigente
docs/CONTINUIDAD_AGENTES_CASO_PRACTICO.md, junto con sus contratos y estado
del equipo. Verifica que origin/main contenga eccd465 e incorpóralo a mi rama
conservando los avances de privacidad-auditoria y constancias-verificables.
Se reutilizan P20, P21 y el directorio común, con administrador/TI, profesor
y estudiante. No hagas otro login, matriz ni tablas de Tickets. Tickets ya
guarda solution, resolvedAt, failureConfirmed y TicketChange: son insumos para
Constancias y Auditoría, no esos módulos terminados. No determines elegibilidad
solo por estar resuelto: coordina un contrato autorizado con Tickets. Las vistas
iniciales de constancias de f15d204 siguen separadas y todavía no consultan ni
emiten desde un backend. Conserva ese avance. Las migraciones del aviso ya están
aplicadas; no las edites ni dupliques. Revisa lo pendiente de PDF/QR, verificación,
privacidad, auditoría global y P15, y continúa solo la etapa que te indique.
No reescribas los planes por recibir este aviso.
```

## 9. Fuentes del repositorio

- [Contrato del flujo](CONTRATO_FLUJO_CASO_PRACTICO.md).
- [Entrega y validación funcional](entregas/roberto-flujo-caso-practico.md).
- [Estado del equipo](ESTADO_EQUIPO.md).
- [Registro de cambios de BD](REGISTRO_CAMBIOS_BD.md).
- [Operación de la base compartida](OPERACION_SUPABASE.md).
- [Permisos efectivos](CONTRATO_ROLES_PERMISOS.md).
- [Publicación anterior de Usuarios](entregas/roberto-publicacion-usuarios.md).
- [Contrato de evidencias aplazadas](CONTRATO_EVIDENCIAS.md).
- Planes originales: [Johan](../planes/PLAN_JOHAN.md),
  [Jasmine](../planes/PLAN_JASMINE.md) y [Roberto](../planes/PLAN_ROBERTO.md).

Este aviso se entrega en Markdown por indicación de Roberto y sustituye al Excel
preparado en la revisión anterior. No se enviaron mensajes al equipo.
