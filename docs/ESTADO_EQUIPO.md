# Estado del equipo — 11 de noviembre de 2026

## Consulta de cursos propios — punto 1 integrado en main

Roberto autorizó implementar únicamente este punto y después publicar e integrar
su entrega en main el 11 de noviembre. Implementación `498d410`, desde main
`69a6907fb0b8ecf5fd5148e584aabb37c05b8895`, integrada conservando su historia.
Se añadieron GET `/academic/me/courses` y
`/academic/me/sections?courseId=…`, con identidad de sesión, paginación y filtrado
por asociaciones propias e institución. No hay tablas ni migraciones nuevas.

Contrato para Johan: [CONTRATO_CURSOS_PROPIOS.md](CONTRATO_CURSOS_PROPIOS.md).
Le corresponde conectar el selector de su formulario y conservar General sin
curso. Adjuntos y revisión/aplicación de su migración siguen pendientes;
consentimiento/auditoría global mantienen su responsable. Este punto no cierra
la semana 1 del equipo ni inicia CSV/SLA/predicción.

Verificación: 29 pruebas de identidad/calendario aprobadas en PostgreSQL
descartable, compilación API y tipos web aprobados. Detalle y estado de revisión
local en [la entrega](entregas/roberto-semana-01-cursos-propios.md).

Ramas de compañeros comprobadas en GitHub antes de publicar el 11 de noviembre:
Johan `gestion-incidencias@90a2790`, Jasmine `administracion-usuarios@a5a8059`.
Jasmine tiene avances posteriores a la revisión inicial de cursos propios;
esta publicación no los integra ni modifica sus ramas. Sus entregas no están
integradas en main. El estado de infraestructura y accesos del 7 de noviembre se conserva
debajo; no acredita por sí solo aceptaciones posteriores.

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

## Código en main y accesos pendientes

Roberto autorizó publicar en main el 7 de noviembre de 2026. Se integraron
identidad 8b02d6f, coordinación 1b84ba8/13c6cc7, transición 864413a y entrega
de colaboradores 478ea0f, partiendo de origin/main 02d10f5. Comprobar el SHA
actual al sincronizar. Las ramas propias se retiran solo tras verificar la
integración completa; front-vistas se conserva. Ver
[entrega de publicación](entregas/roberto-publicacion-identidad-supabase.md).

Johan/Jasmine: invitaciones Developer enviadas en la organización gratuita
exclusiva CampusITSM; Roberto sigue Owner. Roberto informó que una invitación fue aceptada; falta
identificar/verificar el resto y entregar configuración privada. El código común
ya se obtiene de main. VEXOR permanece en RobertoC1006. El conector de este chat
aún necesita autorizar CampusITSM; panel y aplicación funcionan. Ver
[COLABORADORES_SUPABASE.md](COLABORADORES_SUPABASE.md).

SMTP para confirmaciones fuera del equipo Supabase pendiente; no desactivar
confirmación ni crear cuentas ficticias. Consentimiento/auditoría global y P20/P21
siguen a cargo de Jasmine sobre la identidad común.

## Reparto y autonomía vigentes

| Persona | Trabajo y dependencias |
| --- | --- |
| Roberto | P01/identidad/permisos comunes, infraestructura, calendario/configuración, predicción y notificaciones. Identidad/transición publicadas en main; acompañar conexión de compañeros y contratos pendientes |
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
