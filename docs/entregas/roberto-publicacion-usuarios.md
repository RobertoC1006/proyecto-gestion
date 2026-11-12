# Publicación autorizada de Usuarios — P20

11 de noviembre de 2026. Roberto revisó el nuevo modal y solicitó integrar
la entrega en main. Base anterior: `22484a5`.

## Historia y comportamiento integrado

La rama `usuarios-modal-correcciones` nació directamente de la entrega de
Jasmine `administracion-usuarios@7ab1ed7`, por instrucción expresa de Roberto.
Se conservan sus commits y la corrección `8350650`, sin squash ni cambios
sobre su rama remota. Se integra el módulo de Usuarios con:

- listado, búsqueda, filtros y paginación sobre la API existente;
- edición en el Modal compartido, tarjetas para un rol/un equipo y switch;
- motivo obligatorio y protección de cambios sin guardar/guardado pendiente;
- validación de UUID, enteros y filtros, con errores 400 coherentes;
- OpenAPI y tipos del cliente actualizados, sin modelos paralelos de usuarios;
- permisos y auditoría mediante la identidad común y protección del último admin.

Contrato: [CONTRATO_USUARIOS.md](../CONTRATO_USUARIOS.md).
Consentimiento y auditoría global no se declaran implementados por P20.

## Validación conservada

La integración no cambia el código API/web comprobado en `8350650`:
compilaciones aprobadas, 50 comprobaciones de servidor en PostgreSQL aislado,
ocho recorridos del modal tras el ajuste final y las otras 33 comprobaciones
de pantallas comunes realizadas durante la regresión. Se comprueban además
la conservación del árbol de aplicación y la salud de la instalación habitual.

No hay migraciones nuevas, aplicación remota de SQL ni datos de prueba en
Supabase. La aplicación de trabajo conserva volúmenes, configuración privada
y sesiones. Guardar desde Usuarios modifica datos reales de la base compartida.

## Continuación del equipo

Jasmine/Johan incorporan el nuevo origin/main en sus ramas sin descartar
trabajo y reconstruyen su instalación habitual para consumir esta versión.
Se conservan administracion-usuarios y gestion-incidencias porque son ramas
de compañeros activos. Solo se retira la rama local de correcciones propia,
después de comprobar integración completa y publicación en GitHub.

La instalación única sigue en localhost:8080. Esta publicación no inicia
CSV, IA, predicción, evidencias ni otra semana. Los paquetes de los tres planes
se regeneran con la documentación vigente, sin secretos ni código ejecutable.
