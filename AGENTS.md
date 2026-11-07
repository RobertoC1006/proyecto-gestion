# Inicio para agentes de CampusITSM

Este repositorio tiene acuerdos de trabajo conservados por solicitud expresa del usuario.

Antes de implementar:

1. Leer `MEMORIA_PROYECTO.md` y el plan de la persona a la que estás ayudando en `planes/`. Si estás ayudando a Roberto, leer `planes/PLAN_ROBERTO.md`.
2. Revisar estado de Git, cambios sin confirmar, `main`, ramas remotas/activas y contexto compartido disponible. No asumir que una referencia guardada prueba el estado actual.
3. Usar los mockups finales enlazados en el plan. Ya están en `diseno/campusitsm/`; no solicitarlos otra vez si existen.
4. Ejecutar solo la etapa/semana que el usuario indique. Consultar el punto de reanudación actualizado del plan y `docs/ESTADO_EQUIPO.md`: identidad tiene entrega en rama; el siguiente avance de infraestructura acordado es habilitar la base compartida en Supabase. No programar por el solo hecho de leer esta memoria.
5. Leer `docs/COORDINACION_SUPABASE.md` y `docs/REGISTRO_CAMBIOS_BD.md`. El destino acordado es una misma base de desarrollo para los tres backend; el traslado, las conexiones y los colaboradores todavía están pendientes. No dar por habilitada una decisión de arquitectura ni aplicar cambios remotos por el solo hecho de leer un plan.

Reglas expresas: React/Vite + NestJS + PostgreSQL/Prisma + Docker, Python auxiliar; una rama por módulo con nombre normal, sin `codex/`; eliminar la rama local/remota solo tras integración verificada, sin borrar ramas ajenas activas. Reutilizar componentes y servicios, sin lógica paralela. Respetar permisos y datos privados.

Los tres integrantes hacen frontend y backend de sus módulos. Roberto coordina y publica primero la base compartida. Consultar a Roberto al llegar a la selección de proveedor de IA. No implementar las cuatro semanas de golpe ni elegir un proveedor anticipadamente.

Reparto vigente: Roberto asume P01, Supabase Auth y la base de roles/permisos. Jasmine administra usuarios/permisos a través de esa base y conserva consentimiento/auditoría/constancias/reportes; no crea otro login. El diseño compartido y sus componentes están descritos en `docs/DISENO_COMPONENTES.md` y se reutilizan en las pantallas del mockup.

Docker de trabajo: una sola instalación `campusitsm` por computadora, en `http://localhost:8080`, con frontend/backend y Python locales. Una vez habilitada la transición, los tres backend usarán la misma base de desarrollo Supabase. PostgreSQL local queda para pruebas aisladas. El Compose actual aún usa PostgreSQL local y aplica migraciones al arrancar: no apuntarlo al destino remoto sin la entrega de transición que separa ambos pasos. Conservar los volúmenes existentes; esta decisión no autoriza borrarlos.

Cada integrante escribe y valida las migraciones de su módulo en el único esquema Prisma. Revisar tablas, índices, contratos, ramas y cambios anunciados antes de crear otros. Una vez habilitada la base común y los accesos, cada integrante y su agente pueden crear tablas, columnas e índices nuevos de su módulo dentro del plan, compatibles y validados, sin pedir permiso por cada cambio. Registrar archivo/commit, destino, ejecutor y verificación y avisar al equipo; ese aviso no es una aprobación adicional. Consultar previamente cambios sobre otros módulos, identidad/permisos comunes o incompatibles. No borrar tablas o datos existentes. Una migración ordinaria delegada puede aplicarse antes de fusionar el módulo completo; los cambios comunes requieren acuerdo de sus responsables, sin repetir aprobaciones existentes. La integración en main sigue requiriendo autorización de Roberto. No editar migraciones aplicadas ni mantener SQL manual sin historial. Una rama Git no aísla la base compartida. Las pruebas destructivas nunca apuntan a ella y no dejan otra aplicación de revisión encendida. No duplicar usuarios, login, catálogos o servicios por una dependencia pendiente.
