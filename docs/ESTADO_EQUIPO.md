# Estado del equipo — 7 de noviembre de 2026

## Avance de identidad en rama, todavía sin integrar

Roberto inició `identidad-supabase` desde main `02d10f5` tras verificar GitHub.
Supabase Auth alojado creado/conectado, registro propio, confirmación y recuperación
por enlace PKCE, login/logout y sesiones de servidor implementados. Roberto completó
registro/confirmación/login reales y autorizó su cuenta como primer administrador.
Roles y permisos viven en PostgreSQL local; no se migró la base de negocio.
Ver [contrato operativo](CONTRATO_IDENTIDAD.md), [configuración del equipo](AUTH_DESARROLLO.md)
y [entrega de identidad](entregas/roberto-semana-01-identidad.md).

Las observaciones anteriores sobre identidad no implementada, conservadas debajo
como contexto de main/base, se refieren a la entrega previa. Esta rama aún no está
publicada/integrada. Consumo de compañeros: esperar autorización de integración.
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
| Roberto | `identidad-supabase`: P01, Supabase Auth, sesión y roles/permisos comunes | Definir modalidad/proyecto al iniciar. Implementar los puertos del calendario y publicar contratos; no trasladar la base de negocio a Supabase por esta decisión |
| Johan | `gestion-incidencias`: P02–P08, frontend/backend/pruebas | Reutilizar componentes existentes; identidad y contexto académico de Roberto, auditoría de Jasmine. No crear otro login o motor de permisos |
| Jasmine | `administracion-usuarios`: P20, consentimiento y auditoría; P21 según su semana | Usar identidad/autorización de Roberto para perfiles/estado/equipo y asignaciones autorizadas; conserva constancias, privacidad y reportes. P01 ya no le corresponde |

Los tres planes reflejan esta división: Roberto 8 pantallas, Johan 7, Jasmine 9.
La reasignación aumenta la carga de Roberto; revisar el ritmo antes de prometer
fechas de semanas posteriores. Cada integrante hace frontend, backend y pruebas.
No se iniciaron ramas ni se enviaron mensajes a los compañeros por actualizar planes.

## Funcional frente a pendiente

- Funcional: base Docker; dominio y API académica; P17/P18 y componentes visuales.
- Sin identidad real, el calendario devuelve 401. El directorio predeterminado
  tampoco acepta usuarios inventados. Las pruebas inyectan identidad únicamente
  dentro del ejecutable de prueba y usan fixtures visuales identificados.
- Pendiente: Supabase Auth, login/sesión reales, autorización común y recorrido
  autenticado; conexión de AcademicChange a auditoría de Jasmine. Ver
  [CONTRATO_IDENTIDAD.md](CONTRATO_IDENTIDAD.md).
- `/academic/me/events` existe; `/academic/context`, cálculo del factor y SLA
  siguen pendientes. CSV es semana 2. No hay tickets, PDF, IA ni pronóstico real.
- No se eligió proveedor de IA, no se creó proyecto Supabase ni se configuraron
  claves. Integrar la entrega aprobada no inicia automáticamente el módulo Auth.

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
y referencias. El código se obtiene de main y cada compañero levanta su propio
Docker con datos locales, sin conectarse a la computadora de Roberto.

Antes de implementar: leer AGENTS, memoria, plan propio, estado, contratos y guía
visual; revisar ramas remotas y cambios sin confirmar. No recrear la base ni
simular permisos para saltarse dependencias todavía pendientes.
