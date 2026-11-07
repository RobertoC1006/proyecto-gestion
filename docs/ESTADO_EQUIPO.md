# Estado del equipo — 7 de noviembre de 2026

## Acuerdo vigente: desarrollo compartido en Supabase, transición pendiente

Roberto decidió que los tres backend consulten una misma base de desarrollo en
Supabase y que Johan/Jasmine participen como colaboradores. Cada integrante
mantiene frontend/backend/Python en su Docker; las ramas siguen separando el código.
Los datos y cambios de estructura remotos serán comunes después de habilitarlo.
Guía obligatoria: [COORDINACION_SUPABASE.md](COORDINACION_SUPABASE.md).
Cambios de esquema: [REGISTRO_CAMBIOS_BD.md](REGISTRO_CAMBIOS_BD.md).

Estado técnico: el Compose actual sigue apuntando a PostgreSQL local con migración
automática al arrancar. No se trasladó negocio, adaptó esa conexión ni invitó a
colaboradores en esta actualización documental. Roberto debe preparar/verificar
esa entrega antes de que los compañeros apunten al destino remoto. No borrar
volúmenes ni interpretar esta guía como habilitación o autorización de migraciones.
La edición actual solo cambia planes/contexto y regenera sus paquetes.

## Avance de identidad en rama, todavía sin integrar

Roberto inició `identidad-supabase` desde main `02d10f5` tras verificar GitHub.
Supabase Auth alojado creado/conectado, registro propio, confirmación y recuperación
por enlace PKCE, login/logout y sesiones de servidor implementados. Roberto completó
registro/confirmación/login reales y autorizó su cuenta como primer administrador.
Roles y permisos viven en PostgreSQL local; no se migró la base de negocio.
Ver [contrato operativo](CONTRATO_IDENTIDAD.md), [configuración del equipo](AUTH_DESARROLLO.md)
y [entrega de identidad](entregas/roberto-semana-01-identidad.md).

La rama aún no está publicada/integrada. Los compañeros reciben el código base
autorizado por Roberto y comprueban su commit antes de consumirlo como main.
Pendiente: SMTP propio para registro con correos fuera del equipo Supabase,
consentimiento y auditoría global de Jasmine. Sus P20/P21 usan el servicio de acceso
común; no deben crear otro login. Semana 1 no se da por cerrada por esta entrega.

## Base para los tres integrantes

Docker se publicó en [PR #1](https://github.com/RobertoC1006/proyecto-gestion/pull/1),
main `196a2144aae253ca672eeeaf721c62204516245a`. Incluye web, NestJS,
PostgreSQL/Prisma, Python interno de salud, migraciones y volúmenes. Conserva la
historia del frontend `front-vistas@a4896261f92507155f5f153f7476fd29d99d631b`.

Roberto aprobó el diseño e indicó integrar el calendario y la base visual mediante
[PR #2](https://github.com/RobertoC1006/proyecto-gestion/pull/2).
Código visual de referencia: `047d1a2e0fd4f71bb189ff301cacb6e1f21019cf`.
Antes de empezar un módulo, obtener main y verificar que contiene ese commit y
los planes actualizados; registrar el SHA actual. No usar una rama provisional
como nueva base ni borrar ramas ajenas. `front-vistas` se conserva.

La entrega incluye cursos, secciones, asociaciones y CRUD de eventos, migración,
contrato y P17/P18. Se portaron componentes reales de casos-gestion adaptados a
CampusITSM: DM Sans/Manrope, Phosphor, Sidebar/AppHeader y controles compartidos.
Consultar [la guía visual](DISENO_COMPONENTES.md). Las vistas restantes siguen
siendo provisionales y cada responsable debe adaptarlas a esa misma base.

## Reparto actualizado por Roberto

| Persona | Siguiente módulo previsto | Dependencias y límites |
| --- | --- | --- |
| Roberto | Identidad implementada en rama; siguiente entrega de infraestructura: base de desarrollo compartida | Preparar traslado, conexión/arranque sin migración remota automática, sesiones, configuración privada y colaboradores. Pendiente de ejecutar; conservar el login y contratos existentes |
| Johan | `gestion-incidencias`: P02–P08, frontend/backend/pruebas | Reutilizar componentes existentes; identidad y contexto académico de Roberto, auditoría de Jasmine. No crear otro login o motor de permisos |
| Jasmine | `administracion-usuarios`: P20, consentimiento y auditoría; P21 según su semana | Usar identidad/autorización de Roberto para perfiles/estado/equipo y asignaciones autorizadas; conserva constancias, privacidad y reportes. P01 ya no le corresponde |

Los tres planes reflejan esta división: Roberto 8 pantallas, Johan 7, Jasmine 9.
La reasignación aumenta la carga de Roberto; revisar el ritmo antes de prometer
fechas de semanas posteriores. Cada integrante hace frontend, backend y pruebas.
La actualización documental no modifica aplicaciones ni Supabase ni envía mensajes
a los compañeros. El mensaje preparado está en [MENSAJE_COORDINACION_EQUIPO.md](MENSAJE_COORDINACION_EQUIPO.md).

## Funcional frente a pendiente

- Publicado en main: base Docker; dominio/API académica; P17/P18 y componentes.
- Implementado en rama: Supabase Auth, sesión, autorización común y directorio
  canónico; registro/login/administrador comprobados por Roberto. Sin sesión se
  conserva 401; no acepta usuarios o permisos inventados por el cliente.
- Pendiente: transición de base compartida y colaboradores, SMTP para correos
  externos y consentimiento/auditoría global de Jasmine. AcademicChange e
  IdentityChange conservan cambios atómicos pendientes de su integración.
- `/academic/me/events` existe; `/academic/context`, cálculo del factor y SLA
  siguen pendientes. CSV es semana 2. No hay tickets, PDF, IA ni pronóstico real.
- Proyecto Auth CampusITSM creado y configurado. No se eligió proveedor de IA ni
  se implementaron sus módulos al actualizar los planes.

## Comprobaciones y colaboración

La revisión manual usa únicamente `campusitsm`, en `http://localhost:8080`.
Roberto indicó reutilizar esa instalación para todos los módulos: reconstruir
desde la rama activa, conservar volúmenes y mantener la autorización separada
para integrar Git en main. Se cerró `campusitsm-calendar-review` conservando sus
datos; no debe recrearse como flujo de revisión. Las pruebas con datos
descartables permanecen aisladas de los datos de trabajo, sin otra aplicación
de revisión encendida.

La entrega base se construyó desde clon limpio y se verificaron salud,
migraciones, semilla, restricciones, persistencia y fallo/recuperación de Python.
Calendario: siete escenarios de integración PostgreSQL y persistencia después de
recrear contenedores sin borrar volúmenes. Interfaz: compilación y seis pruebas
Playwright, incluyendo edición/conflicto/eliminación, bloqueo real sin sesión,
móvil y menú. Informes en `docs/entregas/` con sus límites y capturas.

Los ZIP se regeneran con `python scripts/prepare-plan-packages.py`; son contexto
y referencias. Cada compañero obtiene el código autorizado y conserva su Docker;
el destino acordado es la misma base Supabase, no las bases independientes del
estado previo. Una migración común validada/autorizada puede aplicarse antes de
fusionar todo un módulo; se registra archivo/commit, ejecutor y verificación. Ninguna
prueba destructiva usa esa base. La habilitación todavía está pendiente.

Antes de implementar: leer AGENTS, memoria, plan propio, estado, contratos y guía
visual; revisar ramas remotas y cambios sin confirmar. No recrear la base ni
simular permisos para saltarse dependencias todavía pendientes.
