# Inicio para agentes de CampusITSM

Este repositorio tiene acuerdos de trabajo conservados por solicitud expresa del usuario.

Antes de implementar:

1. Leer `MEMORIA_PROYECTO.md` y el plan de la persona a la que estás ayudando en `planes/`. Si estás ayudando a Roberto, leer `planes/PLAN_ROBERTO.md`.
2. Revisar estado de Git, cambios sin confirmar, `main`, ramas remotas/activas y contexto compartido disponible. No asumir que una referencia guardada prueba el estado actual.
3. Usar los mockups finales enlazados en el plan. Ya están en `diseno/campusitsm/`; no solicitarlos otra vez si existen.
4. Ejecutar solo la etapa/semana que el usuario indique. Consultar el punto de reanudación actualizado del plan y `docs/ESTADO_EQUIPO.md`: Docker ya tiene entrega; Supabase Auth y la autorización común son el siguiente módulo de Roberto. No programar por el solo hecho de leer esta memoria.

Reglas expresas: React/Vite + NestJS + PostgreSQL/Prisma + Docker, Python auxiliar; una rama por módulo con nombre normal, sin `codex/`; eliminar la rama local/remota solo tras integración verificada, sin borrar ramas ajenas activas. Reutilizar componentes y servicios, sin lógica paralela. Respetar permisos y datos privados.

Los tres integrantes hacen frontend y backend de sus módulos. Roberto coordina y publica primero la base compartida. Consultar a Roberto al llegar a la selección de proveedor de IA. No implementar las cuatro semanas de golpe ni elegir un proveedor anticipadamente.

Reparto vigente: Roberto asume P01, Supabase Auth y la base de roles/permisos. Jasmine administra usuarios/permisos a través de esa base y conserva consentimiento/auditoría/constancias/reportes; no crea otro login. El diseño compartido y sus componentes están descritos en `docs/DISENO_COMPONENTES.md` y se reutilizan en las pantallas del mockup.
