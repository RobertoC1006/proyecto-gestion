# Colaboradores y organización de CampusITSM

Estado verificado el 7 de noviembre de 2026, por solicitud y autorización expresa
de Roberto: crear una organización gratuita exclusiva, trasladar solo CampusITSM
e invitar a Johan y Jasmine como Developer. No se contrató ningún plan de pago.

## Destino vigente y acceso comprobado

- Organización: [CampusITSM](https://supabase.com/dashboard/org/exhurkcxcrjlskvldchp),
  ID exhurkcxcrjlskvldchp, plan Free.
- Proyecto existente: [CampusITSM](https://supabase.com/dashboard/project/npjibnlxepiwfermtcmo),
  ID npjibnlxepiwfermtcmo, región sa-east-1, esquema de negocio campusitsm.
- Roberto sigue como Owner. Las invitaciones de Johan y Jasmine figuran INVITED
  con rol Developer en el [equipo](https://supabase.com/dashboard/org/exhurkcxcrjlskvldchp/team).
  Enviadas no significa aceptadas; no se comprobó aún el acceso de sus cuentas.
- VEXOR permanece en RobertoC1006. A los colaboradores se los invitó únicamente
  a CampusITSM; no se les concedió acceso a la organización de VEXOR.

Se trasladó el mismo proyecto, sin crear otra base ni copiar los datos otra vez.
Se conservaron proyecto, URL, credenciales de API/PostgreSQL, esquema y datos.
Verificación posterior: salud API/database/Python ok, 1 perfil administrador,
1 curso, 1 evento y pg_stat_ssl.ssl=true. No hubo otra migración de negocio.

## Qué deben hacer Johan y Jasmine

1. Abrir la invitación de Supabase en el correo que proporcionaron y aceptarla
   con esa cuenta. Si no tienen cuenta de Supabase, crearla personalmente.
   La invitación tiene una vigencia de 24 horas; si vence, pedir a Roberto el reenvío.
2. Abrir organización CampusITSM, proyecto CampusITSM y esquema campusitsm
   en el editor de tablas. Revisar tablas e historial antes de crear otro objeto.
3. Autorizar en su conexión Supabase de su agente la organización CampusITSM.
   Poder entrar al panel no concede automáticamente acceso a un conector ya
   autenticado para otra organización; comprobar el proyecto real desde su agente.
4. Obtener el código autorizado por Roberto y la conexión de servidor por un
   medio privado. El ZIP contiene documentación y referencias, no credenciales.
   Seguir [OPERACION_SUPABASE.md](OPERACION_SUPABASE.md) y generar su propia
   AUTH_ENCRYPTION_KEY; no copiar el .env completo de otra persona.
5. El acceso al panel no crea una cuenta ni un rol administrador dentro de la
   aplicación CampusITSM. Cada persona completa registro/confirmación/login en
   la aplicación para tener su AppUser canónico; por defecto estudiante. No
   crear perfiles alternativos, contraseñas o administradores automáticos.

El correo Auth incluido solo envía a miembros del equipo, con límites reducidos.
Tras aceptar, sus mismos correos de miembro pueden usarse en las pruebas de
registro; no se verificó aún ese recorrido en sus computadoras. Personas ajenas
al equipo siguen requiriendo SMTP propio para confirmaciones. No desactivar
confirmación ni añadir usuarios públicos como colaboradores para evitar ese límite.

## Permisos y coordinación

Developer administra contenido del proyecto, pero no cambia sus ajustes ni
elimina el proyecto. Sí puede borrar datos, usuarios o archivos: la prohibición
acordada de borrar tablas/datos es una regla de trabajo para personas/agentes,
no una restricción técnica de ese rol del panel. Conservar respaldos, migraciones
versionadas y validación; no conceder Owner/Administrator para desarrollar módulos.

Tablas/columnas/índices nuevos compatibles del módulo asignado: validar en base
local descartable, guardar nueva migración Prisma, aplicar explícitamente, registrar
y avisar sin permiso por tabla. Consultar antes partes comunes, otros módulos o
incompatibilidades. No editar migraciones aplicadas ni duplicar login/catálogos.
El rol de panel, el rol PostgreSQL de conexión y el rol CampusITSM son distintos.

## Conector de Roberto y pendientes

El conector Supabase de este chat solo estaba autorizado para RobertoC1006.
Después del traslado, get_project de CampusITSM devuelve falta de permiso; la
aplicación Docker y el panel del propietario siguen funcionando. Hace falta
volver a autorizar la nueva organización CampusITSM en esa conexión antes de
usar el conector para consultas/migraciones. No interpretar el error como pérdida
ni borrado o recreación de la base, ni intentar suplirlo con claves del navegador.

Pendientes: aceptación de ambos, autorización de sus conectores, entrega privada
de configuración/código e integración cuando Roberto la autorice; SMTP público
y contratos de consentimiento/auditoría de Jasmine conservan su alcance.
No se enviaron mensajes adicionales al equipo, solo las invitaciones solicitadas.

Referencias: [roles e invitaciones](https://supabase.com/docs/guides/platform/access-control),
[transferencias](https://supabase.com/docs/guides/platform/project-transfer) y
[correo de Auth](https://supabase.com/docs/guides/auth/auth-smtp).
