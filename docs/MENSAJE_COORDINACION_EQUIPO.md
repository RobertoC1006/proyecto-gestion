# Mensaje para Johan y Jasmine

Johan y Jasmine, actualicé sus planes para que trabajemos sobre una misma base de
desarrollo en Supabase. Cada uno seguirá haciendo el frontend y backend de sus
módulos en su Docker, pero, cuando habilitemos la conexión compartida, veremos los
mismos usuarios, roles, eventos y datos autorizados.

Les voy a dar acceso como colaboradores, revisando los permisos para CampusITSM.
El traslado y esas invitaciones todavía están pendientes: les avisaré cuando esté
lista la conexión y les compartiré la configuración por un medio privado.

Mantendremos una rama por módulo. Pueden crear las tablas, columnas e índices
nuevos de su módulo, dentro del plan y sin afectar otros módulos, sin pedirme
permiso por cada cambio. Revisen lo que ya existe, guarden las migraciones en Git,
valídenlas y registren/avisen qué aplicaron. No necesitan esperar a terminar todo
el módulo para compartirlo. Si van a modificar partes comunes o de otro módulo,
o romper algo que ya funciona, coordinémoslo antes. No borren tablas ni datos existentes.

Una tabla nueva se verá directamente en el panel de Supabase. Solo quien programe
funciones para usarla necesitará actualizar su código y reconstruir la aplicación
si corresponde; los cambios de datos no requieren reconstruir Docker.

Pasen a sus agentes el ZIP actualizado de su plan. Deben leer AGENTS.md, su plan,
docs/COORDINACION_SUPABASE.md, docs/ESTADO_EQUIPO.md y los contratos antes de empezar.
No deben crear otro login, otra base principal ni tablas/servicios que ya existan.
Tampoco ejecutar reinicios o pruebas que borren datos sobre la base compartida.

El reparto de módulos y pantallas se mantiene. Yo coordino la base común y las
integraciones; ustedes mantienen el desarrollo completo de sus módulos.
