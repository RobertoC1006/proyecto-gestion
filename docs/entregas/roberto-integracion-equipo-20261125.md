# Integración corregida de Johan y Jasmine — 25 de noviembre de 2026

Roberto autorizó corregir e integrar todas las entregas y publicar main al completar
la validación. También confirmó expresamente Groq como proveedor en esta sesión.
Estado: código combinado, migraciones aplicadas y validación automática aprobada;
recorrido con cuentas reales y publicación pendientes.

## Corrección del acceso detectada durante la prueba personal

El formulario devolvía VALIDATION_ERROR para correo y contraseña aun con un
correo ficticio sintácticamente válido. Causa confirmada en el código instalado
de Nest: el jsonParser registrado solo para verificación de PDFs hacía que se
omitiera el parser JSON general. Las pruebas HTTP anteriores creaban Nest sin
ese middleware de arranque, por lo que no cubrían esta combinación.

Se registra explícitamente el parser normal de 100 KiB después del específico
de PDFs de 7 MiB. La nueva prueba `http-body-parser.test.cjs` usa AuthController
y la misma configuración de middleware con un proveedor ficticio: reprodujo
el fallo antes del cambio y pasó después. Suite completa: 139 tests aprobados,
sin fallos/omisiones. No se cambian usuarios, contraseñas ni límites de PDF.

Merge funcional verificado: `9a3eaf4120a5689f7a75a66e465322cde7d550d9`, padres
`0f4927f` (integración de Johan) y `c218cf4` (Jasmine). Todas las entregas remotas
revisadas son ancestros. La ejecución final conjunta de navegador aprobó los
56 recorridos en 20.8 s, sin omisiones; supera el resultado por bloques detallado
más abajo. El índice servido coincide con el dist verificado y la salud sigue ok.

## Historia y resolución

Partida `integracion-avances-equipo@001864a`, main remoto `d8ef0ca` comprobado
mediante fetch/ls-remote. Se incorporó `gestion-incidencias@786154d` y se resolvió
el merge de `auditoria-constancias@c218cf4` conservando ambas historias. Las demás
ramas remotas de Jasmine no tenían avances posteriores. Las ramas/worktrees
ajenos y el directorio outputs existente se conservan.

Se preservaron permisos efectivos, identidad, contexto académico, prioridades,
reportes en fecha de Lima, consentimiento y auditoría general del candidato.
OpenAPI y tipos web se regeneraron desde NestJS combinado. Effect sigue en
3.22.1; npm audit de la API instalada: cero avisos.

## Correcciones de integración

- Groq recibe una proyección con vocabulario técnico cerrado, no texto libre del
  reporte. Se excluyen correos, DNI, teléfonos y nombres incluso si no tienen un
  formato reconocible. La descripción original permanece en el servidor para TI.
  Este enfoque reduce la información disponible al clasificador; no acredita una
  tasa de exactitud. Proveedor/modelo/versión y fallos siguen siendo trazables.
- Clasificación y derivación a revisión manual registran TicketChange con
  antes/después en la misma transacción. El actor automático es nulo y se muestra
  como Sistema de clasificación; no se suplanta al titular. Se mantiene el bloqueo
  por versión contra respuestas tardías y los plazos parten de createdAt.
- Corregir servicio conserva reportedService incluso en tickets DEMO que aún
  tenían ese campo nulo. No se reinicia el SLA.
- Auditoría de constancias registra emisión, descarga, consulta del código y
  validación. La auditoría general integra los eventos sin duplicar la emisión
  derivada de Certificate ni atribuir verificaciones públicas al titular.
- Se mantiene el PDF original, su huella y el error compatible
  CERTIFICATE_FILE_UNAVAILABLE. Archivo ausente/corrupto no se regenera. Escritura
  temporal y renombrado, comprobación de ruta/archivo y comparación de hash.
- El verificador admite multipart de hasta 5 MiB y mantiene JSON/base64 para los
  consumidores anteriores. Consulta del código devuelve encontrada; validar el
  archivo devuelve valida o alterado. La web diferencia esos resultados.
- Las pruebas de ambos autores se conservaron en archivos separados; los fixtures
  se ajustaron a los nuevos eventos auditados y a los mensajes actuales sin
  retirar comprobaciones de privacidad, aislamiento, concurrencia o integridad.

## Base compartida y migraciones

La migración de constancias modificada por Jasmine no reemplazó el archivo
aplicado. Se conservaron byte por byte las doce migraciones anteriores, incluido
su checksum `fdc3f6328a0393eb826b83927da0d92b60399a9424e7d0be00830bf8e2025dd9`.
Los cambios se agregaron mediante tres migraciones. Ver el
[registro BD](../REGISTRO_CAMBIOS_BD.md) para destino, huellas y tiempos.

`scripts/verify-team-upgrade.py` restaura los doce SQL desde `001864a` en una base
PostgreSQL tmpfs sin red, crea un ticket/constancia ficticios y aplica únicamente
las tres ampliaciones. Comprobó Certificate idéntico antes/después, reportedService
recuperado, un evento histórico de emisión, actor automático nullable y revocación
real de UPDATE/DELETE sobre Certificate incluso con privilegios predeterminados.
No usa .env ni Supabase; elimina exclusivamente su contenedor temporal.

Tras validación, el comando migrador documentado aplicó las tres ampliaciones
en CampusITSM. Verificación posterior: quince migraciones finalizadas y quince
huellas exactas, TLS y rol/esquema correctos; Certificate solo SELECT/INSERT para
API, eventos sin UPDATE/DELETE y sin permisos anon/authenticated.
No hubo reset, db push, seed remoto, borrado de datos/volúmenes ni cambios de Auth.

## Pruebas

- API/Prisma y frontend compilados; OpenAPI y tipos generados.
- Suite completa de los 23 archivos `apps/api/test/*.test.cjs`: 138 tests
  aprobados, cero fallos/omisiones, PostgreSQL 17 descartable y quince migraciones.
  Groq y proveedores de identidad sustituidos únicamente en pruebas.
- La nueva prueba ticket-ai.integration comprueba la proyección sin datos
  personales, cambio de servicio/prioridad y evento atómico, fallback sin clave,
  protección de edición humana y fallo de contexto. No llama a Groq real.
- Navegador: 56 recorridos distintos aprobados. Primera ejecución: 55/56 y una
  expectativa antigua de Pendiente; después de ajustarla a Clasificación pendiente,
  los cinco recorridos de incidencias pasaron. El resto pasó en la ejecución
  conjunta. Se incluyen los dos recorridos nuevos de auditoría de constancias.
- Las verificaciones de actualización fallaron inicialmente por campos obligatorios
  ausentes y codificación del fixture SQL en Windows. Se corrigió el fixture y se
  fijó UTF-8; la comprobación final aprobó. No eran fallos de migración productiva.
- Logs privados/locales: `.local/team-20261125-*`; no se publican credenciales.

## Instalación y continuación

La única instalación campusitsm fue reconstruida con sus volúmenes y configuración
conservados. Web, API y Python saludables; API/base/Python devuelven ok en
localhost:8080. La base local histórica permanece detenida.

La pestaña real está en login. Roberto debe iniciar sesión personalmente como
administrador, cambiar después al estudiante titular y volver al administrador.
Faltan cola/atención/resolución de un DEMO, seguimiento, emisión/descarga, PDF
original/copia alterada y comprobación de auditorías/reportes en la instalación.
La autorización de merge/push está dada y no debe solicitarse nuevamente por rutina.
Tras el recorrido satisfactorio: integrar main, push normal, verificar SHA remoto,
reconstruir desde main y actualizar este estado con resultados reales.

Groq está confirmado, pero no hay GROQ_API_KEY en la configuración local. Se
conserva fallback a revisión manual; no se inventó una clave ni se enviaron
descripciones reales. Configurar la clave privadamente permitirá probar el
proveedor real. La prueba de exactitud con corpus independiente sigue pendiente.
La política de consentimiento todavía necesita publicación de su texto aprobado;
no se inventa ni se acepta automáticamente. Pronóstico y adjuntos mantienen su alcance.
