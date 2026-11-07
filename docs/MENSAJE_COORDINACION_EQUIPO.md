# Mensaje para Johan y Jasmine

Johan y Jasmine, actualicé sus planes para que trabajemos sobre una misma base de
desarrollo en Supabase. Cada uno seguirá haciendo el frontend y backend de sus
módulos en su Docker, pero, cuando habilitemos la conexión compartida, veremos los
mismos usuarios, roles, eventos y datos autorizados.

Les voy a dar acceso como colaboradores, revisando los permisos para CampusITSM.
El traslado y esas invitaciones todavía están pendientes: les avisaré cuando esté
lista la conexión y les compartiré la configuración por un medio privado.

Mantendremos una rama por módulo. Antes de crear o modificar tablas, columnas,
relaciones o índices, coordinemos el cambio para no duplicar trabajo ni afectar
lo que usa otro. Guarden sus migraciones en Git y valídenlas primero en una base de
prueba. Los cambios aprobados podrán aplicarse a la base compartida sin esperar a
terminar todo el módulo, dejando registrado qué se aplicó y quién lo hizo.

Pasen a sus agentes el ZIP actualizado de su plan. Deben leer AGENTS.md, su plan,
docs/COORDINACION_SUPABASE.md, docs/ESTADO_EQUIPO.md y los contratos antes de empezar.
No deben crear otro login, otra base principal ni tablas/servicios que ya existan.
Tampoco ejecutar reinicios o pruebas que borren datos sobre la base compartida.

El reparto de módulos y pantallas se mantiene. Yo coordino la base común y las
integraciones; ustedes mantienen el desarrollo completo de sus módulos.
