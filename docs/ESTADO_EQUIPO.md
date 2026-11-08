# Estado del equipo — 7 de noviembre de 2026

## Base de negocio trasladada y conectada para Roberto

Supabase CampusITSM, organización exclusiva CampusITSM (exhurkcxcrjlskvldchp),
esquema privado campusitsm; proyecto npjibnlxepiwfermtcmo conservado tras traslado.
Se aplicaron las seis migraciones Prisma, se copiaron las 12 tablas con verificación
de conteos/contenido, conservando UUID, permisos y sesiones de Roberto. Auth/storage
no se sobrescribieron. Base local detenida y volumen conservado; respaldos privados
restaurados correctamente en PostgreSQL descartable.

Docker normal inicia web/api/predictions en localhost:8080. Migrar es un comando
manual, con credencial separada. La API no puede crear tablas ni escribir el
historial; comprueba las migraciones requeridas al iniciar. Sesiones y PKCE tienen
ámbito por instalación y claves propias. No compartir claves de cifrado.

[Operación](OPERACION_SUPABASE.md), [coordinación](COORDINACION_SUPABASE.md),
[registro BD](REGISTRO_CAMBIOS_BD.md) y
[entrega](entregas/roberto-semana-01-base-compartida.md).

## Código y accesos pendientes

Rama local actual base-compartida-supabase, desde identidad-supabase@13c6cc7.
Incluye identidad de 8b02d6f y coordinación de 1b84ba8/13c6cc7.
origin/main comprobado en 02d10f5. Estas ramas no están publicadas/integradas;
no afirmar que main incluye todavía login o la transición. No fusionar sin
la autorización de Roberto. front-vistas se conserva, sin modificar ramas ajenas.

Johan/Jasmine: invitaciones Developer enviadas en la organización gratuita
exclusiva CampusITSM; Roberto sigue Owner. Pendientes de aceptación, código y
configuración privada. VEXOR permanece en RobertoC1006. El conector de este chat
aún necesita autorizar CampusITSM; panel y aplicación funcionan. Ver
[COLABORADORES_SUPABASE.md](COLABORADORES_SUPABASE.md).

SMTP para confirmaciones fuera del equipo Supabase pendiente; no desactivar
confirmación ni crear cuentas ficticias. Consentimiento/auditoría global y P20/P21
siguen a cargo de Jasmine sobre la identidad común.

## Reparto y autonomía vigentes

| Persona | Trabajo y dependencias |
| --- | --- |
| Roberto | P01/identidad/permisos comunes, infraestructura, calendario/configuración, predicción y notificaciones. Transición entregada; integrar código y habilitar compañeros cuando corresponda |
| Johan | P02–P08, incidencias/prioridad/atención/clasificación y evolución de componentes. Reutilizar identidad y calendario |
| Jasmine | P09–P12/P15/P20–P23, administración con servicios comunes, consentimiento/auditoría, constancias/privacidad/reportes |

Cada integrante hace frontend/backend/pruebas de su módulo. Con sus accesos,
puede crear tablas/columnas/índices compatibles nuevos dentro del plan sin permiso
por cambio: validar, migración en Git, registro y aviso. Consultar antes partes
comunes, otros módulos o incompatibilidades. No borrar tablas/datos ni duplicar
login/catálogos. Git separa código; la base compartida recibe cambios inmediatamente.
Ver datos/tablas no requiere reconstruir Docker; consumir nuevas funciones sí
puede requerir actualizar código/modelo y reconstruir esa aplicación.

## Funcional y pruebas

- Roberto comprobó registro/confirmación/login y autorizó su primer administrador.
  Tras el traslado, se verificaron su sesión real, el evento conservado y Crear evento.
- 22 pruebas PostgreSQL de identidad/calendario/proveedor pasaron, incluido el control de conexiones y la de
  dos instalaciones con claves distintas: mismo usuario y evento, sin usar/borrar
  sesiones o flujos PKCE ajenos. Proveedor sustituido exclusivamente en pruebas.
- Respaldo inicial y final restaurados en PostgreSQL 17 descartable; contenido de
  las 12 tablas comparado dentro de la transacción de importación.
- Base visual/calendario en main mediante PR #1/#2; DM Sans/Manrope y Phosphor
  portados de casos-gestion, según DISENO_COMPONENTES.md.
- /academic/me/events existe; contexto/factor/SLA, CSV, tickets, PDF, IA y pronóstico
  siguen pendientes. No se inició otra semana ni se eligió proveedor de IA.

Una instalación de trabajo campusitsm en 8080; conservar volúmenes. Las pruebas
se aíslan y cierran sus contenedores. Los archivos/modelos siguen siendo locales.
Los ZIP son documentación regenerable, sin secretos, y no sustituyen el código
ni acreditan integración. Revisar Git, contratos y el plan propio antes de avanzar.
