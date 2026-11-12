# Revisión de Roberto — migración de tickets de Johan

Prioridad posterior de Roberto, 11 de noviembre: adjuntos/Storage pospuestos para
el primer avance. El núcleo sin evidencia puede avanzar con este dictamen;
la condición de máximo de archivo solo aplica cuando se reactive la carga.
Ver [PRIMER_AVANCE.md](PRIMER_AVANCE.md).

11 de noviembre de 2026. Rama de revisión: `revision-incidencias`, desde
`main@f4a44572ae3b259af23e9a313209d5845a4c3fe4`.
Alcance solicitado por Roberto: revisar la migración y definir el contrato de
evidencias. No incluye aplicar migraciones remotas ni integrar módulos en main.

## Dictamen

**Revisión técnica favorable para el núcleo de tickets de Semana 1 y sus
metadatos opcionales.** Se conserva el SQL de Johan, sin editar una migración
que él ya aplicó localmente. La carga de archivos requiere además la ampliación
de tamaño y la implementación descritas en
[CONTRATO_EVIDENCIAS.md](CONTRATO_EVIDENCIAS.md).

Referencia revisada: `gestion-incidencias@90a2790fe0dd644b7170410103476e71e21ac259`.
Archivo: `apps/api/prisma/migrations/20261108000100_tickets_core/migration.sql`.
SHA-256 del SQL UTF-8/LF:
`d0727f7f1eca862b3fe40da5859493419b98938e076e8c7741cb2466b4b4715a`.
Una versión posterior que cambie este SQL necesita comprobarse nuevamente.

## Comprobación de la base compartida

Consulta de solo lectura desde la conexión existente de la API, con transacción
READ ONLY. Se verificaron el destino esperado antes de conectar y el rol,
esquema y TLS al consultar. No se consultaron descripciones, correos ni archivos.

- Proyecto CampusITSM `npjibnlxepiwfermtcmo`; rol `campusitsm_api`, esquema
  `campusitsm`, conexión SSL activa.
- Seis migraciones finalizadas, sin reversión. Sus seis checksums coinciden
  con los archivos Git de main y de la referencia revisada de Johan.
- Doce tablas de negocio, todas del migrador y con RLS. `Ticket` y
  `TicketAttachment` todavía no existen; no hay una aplicación remota oculta
  de `20261108000100_tickets_core` en el historial consultado.
- API sin CREATE de esquema; API y migrador sin superusuario, BYPASSRLS,
  CREATEDB o CREATEROLE. `anon`/`authenticated` sin USAGE/CREATE en campusitsm.
- Privilegios por defecto del migrador: CRUD de tablas y lectura/uso de
  secuencias para campusitsm_api; ninguna membresía de API/migrador/anon/
  authenticated en otros roles. La revocación del SQL no deja una concesión
  heredada por membresía en los roles revisados.
- El conector Supabase sigue sin permiso sobre CampusITSM; esta consulta utilizó
  únicamente la conexión ya configurada de la aplicación y no amplió permisos.

GitHub se actualizó antes de revisar. Johan seguía en `90a2790`; Jasmine en
`administracion-usuarios@a5a8059`. Jasmine no añade migraciones ni modifica
schema.prisma en esa referencia. No se modificaron sus ramas.

## Resultado de la validación local

`prisma validate` acepta el esquema exacto de Johan. Se ejecutó:

```powershell
python scripts/verify-ticket-migration.py --ref 90a2790fe0dd644b7170410103476e71e21ac259
```

**35 comprobaciones aprobadas en PostgreSQL 17.** Contenedor sin red ni puertos,
datos en memoria y retirada automática al finalizar. No utiliza .env ni admite
una URL remota. Las seis migraciones base y la de tickets se ejecutaron con
un rol migrador no superusuario, dentro del esquema campusitsm.

| Área | Resultado comprobado |
| --- | --- |
| Propiedad y RLS | Ambas tablas pertenecen al migrador; RLS y política ALL exclusiva del servidor |
| Privilegios | API tiene CRUD sin CREATE, TRUNCATE, REFERENCES o TRIGGER; anon/authenticated no leen ni siquiera con USAGE temporal |
| Defaults abiertos | El SQL revoca los privilegios de PUBLIC/anon/authenticated aunque se hubieran concedido por defecto |
| Alcance académico | General rechaza curso/sección; Curso exige curso y acepta sección opcional; FK rechazan institución o curso incompatibles |
| Integridad | Longitud de descripción y hash; código único; clave idempotente única por titular/institución, independiente entre titulares |
| Adjuntos | PNG/JPEG/PDF; tamaño positivo; SHA-256 válido; clave opaca; un adjunto por ticket; claves únicas; FK y borrado restringido |
| Brecha reproducida | Un adjunto de 5 MiB + 1 byte pasa el CHECK actual; falta el máximo antes de habilitar carga |

Estas pruebas comprueban SQL y privilegios. La política del rol de API permite
operar a NestJS; el aislamiento entre titulares lo aplica el servidor. No se
presentan como pruebas HTTP de usuarios reales ni como prueba del Storage remoto.

## Decisiones del contrato de tickets

1. **Servicios:** se mantiene `TicketService` con los once identificadores de
   Johan. Es la fuente canónica de servicios de este módulo para Semana 1;
   React consume `/tickets/services`. No crear otra tabla o lista paralela.
   Si más adelante hace falta administración dinámica, evolucionar esta fuente
   con una migración coordinada y conservar los identificadores utilizados.
2. **Código público:** se acepta `INC-<año UTC>-<24 caracteres hexadecimales
   mayúsculos>`, 96 bits aleatorios criptográficos. Tiene 33 caracteres, cabe en
   VARCHAR(40), cuenta con unicidad SQL y reintento de colisión. No expresa orden
   correlativo, fecha local ni prioridad. El UUID sigue siendo la identidad interna.
3. **Campos académicos:** mantener General con ambos campos nulos y Curso con
   curso obligatorio/sección opcional. NestJS comprueba membresías además de FK.
   Incorporar main para consumir las consultas personales ya publicadas.
4. **Metadatos:** se conserva un adjunto opcional por ticket; su tabla no acredita
   la existencia de un objeto descargable.

## Correcciones y seguimiento de Johan

- **Antes de habilitar carga:** agregar en una nueva migración Prisma el límite
  `sizeBytes <= 5242880`, conservando el CHECK positivo. No editar el SQL inicial
  ya aplicado localmente. Validar los extremos 1, 5242880 y 5242881 bytes.
- **Antes de importar historiales grandes:** añadir un índice de Ticket sobre
  `(institutionId, courseId, sectionId)` para las FK académicas; los índices
  actuales por titular/estado sirven al listado personal, pero no cubren ese
  prefijo. Es una mejora de rendimiento, no un fallo de autorización ni un
  bloqueo del núcleo actual.
- Completar pruebas HTTP con cuentas distintas: creación autorizada, 404 uniforme
  para ticket ajeno/inexistente y validación de asociaciones. Las pruebas de
  servicio actuales de Johan usan sustitutos y no acreditan esos recorridos.
- Limpiar comentarios históricos «SQL futuro» y «servicio provisional» cuando
  incorpore este dictamen; las restricciones iniciales ya existen en su SQL.

## Paso remoto posterior

La revisión solicitada queda concluida para esta referencia. La aplicación de
la migración corresponde a Johan dentro de su módulo y del alcance delegado,
usando credencial migradora, el historial exacto y el procedimiento manual de
[OPERACION_SUPABASE.md](OPERACION_SUPABASE.md). Registrar destino, ejecutor,
commit y verificación; conservar todas las migraciones recibidas.

Puede aplicar el núcleo antes de fusionar todo su módulo, una vez que incorpore
esta revisión y compruebe de nuevo el destino/historial. No necesita otra
aprobación por tabla. Esta tarea no ejecutó ese paso. La ampliación del máximo
es obligatoria antes de admitir bytes de evidencia; no bloquea crear tickets
sin adjunto. Main y las ramas ajenas permanecen sin integrar este trabajo.

Fundamento de la revisión de privilegios:
[PostgreSQL 17 — Privileges](https://www.postgresql.org/docs/17/ddl-priv.html).
