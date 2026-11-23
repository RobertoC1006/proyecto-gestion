# T5 — integración de entregas verificadas (S1–S3)

## Veredicto de esta unidad

**Parcial: no declarar listo para main.** Unión de reportes con tickets,
constancias, consentimiento y auditoría conservada. El padre conserva la
propiedad del merge y del índice; este trabajo no prepara commits ni publica.

- Se mantienen todos los módulos, scripts y versiones seleccionados. El lock
  resuelto conserva el contenido de HEAD, que ya incluye todos los paquetes
  entrantes; no hubo instalaciones ni actualizaciones.
- El router público `/verificar/:codigo` sigue antes de SessionBoundary;
  login, límites privados por capacidades y privacidad no se deshabilitaron.
- Layout incluye privacidad y reportes; navegación auto-integrada intacta.
- OpenAPI/tipos regenerados desde Nest combinado: 49 rutas, 53 esquemas;
  descarga PDF con 200/binario y 503, resumen/responsable/corrección de Johan,
  consentimiento/auditoría y synthetic boolean de reportes conservados.
- Los tres archivos de navegador originales no necesitaron cambios ni mocks
  nuevos; las llamadas API no previstas siguen abortadas.

## Evidencia reproducible de esta ejecución

Directorio temporal `S`:
`C:/Users/ROBERT~1/AppData/Local/Temp/gpAKastq/garF6jhE/campus-integration-final-c2eaj3gs`.
Se autolimpia al terminar la sesión; reconstruir desde los generadores del
repositorio, no depender de su permanencia. Se copiaron fuentes/dependencias
privadas de pruebas sin cambiar las dependencias compartidas. El runner es
`scripts/verify-workflow.py`, sustituyendo exclusivamente ROOT e imagen.

Imagen final `campusitsm-integration-t5:final-20261121`:
`sha256:7e9eb85dafe03c184deb96092fcb709251ed86c6aa66b33b9be017ce8bd03bdc`.
99 archivos de API (fuente, pruebas, Prisma y manifiestos) comparados byte a
byte con la imagen. Fuente web completa idéntica a la compilación probada.

Comandos (S representa únicamente el directorio temporal anterior):

- `docker build --network none -t campusitsm-integration-t5:final-20261121 -f S/Dockerfile S`
  — salida 0 en ambas compilaciones. Dockerfile hereda dependencias de la imagen
  privacy verificada y ejecuta Prisma validate con URL ficticia, prisma:generate,
  build y api:export. Sin red para esos pasos.
- `python S/verify-workflow.py --tests test/integration.test.cjs` — salida 1,
  inicialmente consentimiento 201 frente a 200 esperado. Se corrigió únicamente
  la expectativa del fixture según el controlador Post sin HttpCode.
  Segunda ejecución: salida 1, 1 fallo, en integration.test.cjs:112:
  `403 !== 404` para lectura personal con administrador extranjero.
- `python S/verify-workflow.py --tests test/auth.test.cjs test/auth.provider.test.cjs test/role-permissions.test.cjs test/users.test.cjs test/academic.test.cjs test/tickets.test.cjs test/workflow.test.cjs test/certificates.test.cjs test/certificates.http.test.cjs test/certificates.integrity.test.cjs test/privacy.test.cjs test/audit.lifecycle.test.cjs test/reports.test.cjs test/reports.http.test.cjs`
  — salida 0, **112 aprobadas, 0 fallidas/omitidas**, en una ejecución combinada.
  No incluye la nueva prueba fallida; no se afirma suite total verde.
- `npm run api:types` y `npm run build` en S/apps/web — salida 0; tsc y Vite
  del frontend combinado aprobados.
- `npm run test:e2e -- --config playwright.final.cjs tickets.spec.cjs certificates.spec.cjs reports.spec.cjs`
  en S/apps/web — salida 0, **11 aprobadas**, sin omisiones. Configuración temporal
  sirve dist en 127.0.0.1:58585 con servidor SPA administrado por Playwright.
- `python S/check-final.py` — comparaciones de ambos padres de rutas/DTO/módulos
  y manifiestos aprobadas. Primer intento rechazó la ampliación válida del enum
  status con `active`; corregido el comparador recursivo. Segundo intento terminó
  con salida 1 por comparación cruda de bytes de Prisma contra git show.
  No se reintentó ese comprobador. `git diff --exit-code HEAD -- apps/api/prisma/schema.prisma`
  salió 0: no hay cambio de esquema (la comparación cruda no normalizaba EOL).
- Verificación independiente posterior: salida 0; byte binding de 99 archivos,
  índice idéntico, JSON válido, referencias registradas, PDF200+503, synthetic,
  ausencia de marcadores en contratos y fuente web idéntica. Solo se copiaron
  de vuelta los dos contratos generados.

- `node --check` sobre integration.test.cjs, export-openapi.cjs y los tres specs
  seleccionados — cada comando salió 0.
- `git diff --check` — salida 0 (solo avisos LF/CRLF).
- `git diff --exit-code HEAD -- apps/api/package-lock.json apps/api/prisma/schema.prisma`
  — salida 0. Los siete archivos resueltos no contienen marcadores; el índice
  permanece deliberadamente UU hasta la intervención del padre.

## Actualización del padre: prueba cruzada aprobada

El padre corrigió únicamente la identidad de prueba: estudiante extranjero para
rutas personales/constancias y administrador extranjero para las operativas.
No se cambiaron permisos ni expectativas de aislamiento. La suite completa de
15 archivos salió 0: **113 aprobadas, 0 fallidas/omitidas**, incluyendo el recorrido
cruzado y las comprobaciones posteriores de denegación y estado inalterado.
Se usó la imagen final anterior con un montaje de solo lectura del test corregido;
el resto de fuentes no cambió. El runner temporal conservó red interna/DB tmpfs y
limpieza, con ROOT/imagen seleccionados y ese montaje explícito. La prueba está
persistida en `test/integration.test.cjs`. Las 11 pruebas de navegador anteriores
siguen correspondiendo a la misma fuente web. Revisión independiente de integración
y pruebas EXTRA T3 continúan pendientes; no declarar listo para main todavía.
La revisión independiente estructural confirmó la unión sin defecto productivo,
pero su ejecución quedó bloqueada: preparador incompatible con worktrees y luego
protección de rutas sensibles antes de ejecutar la preparación alternativa.
Se requiere autorización humana para una copia con lista positiva de código,
pruebas, esquema, manifiestos y contratos públicos, sin configuraciones privadas.
No se eludió esa denegación ni se ejecutaron nuevas pruebas independientes.
La revisión nativa final sigue pendiente; los resultados previos no la sustituyen.

## Antecedentes históricos de la prueba cruzada y límites

`apps/api/test/integration.test.cjs` usa el mismo reemplazo de AuthService y
AcademicIdentity que workflow.test.cjs, con Nest/HTTP y PostgreSQL reales
**descartables**. No usa credenciales ni login real de Supabase. El caso alcanzó
creación del ticket, evaluación/asignación/inicio/resolución, resumen/detalle,
constancia/PDF, consulta/verificación pública y auditoría/reportes coherentes.
Su primera expectativa de aislamiento falla porque administrador no tiene
` tickets:read:self ` ni `certificates:request:self` (auth.policy.ts:12).
No prueba todavía los pasos posteriores de denegación y estado inalterado.

Trabajo restante propuesto al padre: separar fixture estudiante extranjero para
rutas personales/constancias y administrador extranjero para operaciones,
auditoría y reportes; conservar los guards. Autorizar/verificar esa corrección
antes de otro intento: se detuvo la prueba afectada al agotar el ajuste de setup,
sin cambiar lógica productiva para satisfacer el test. La prueba fallida queda
persistida, no omitida ni debilitada. No hay RED/GREEN de un defecto productivo:
los fallos observados fueron expectativas del fixture.

El límite T3 de pruebas EXTRA de colisión con mismo ID/snapshot concurrente
sigue pendiente; no se repitieron ni esta prueba lo sustituye. Riesgos de revisión:
item3 contratos/módulos compartidos, item5 manifiestos, item2 fronteras públicas y
privadas. No hubo cambios de migraciones, base compartida, Supabase, instalación
campusitsm, puerto 8080 o volúmenes existentes. Cada ejecución PostgreSQL usó red
interna única y tmpfs; el runner retiró sus contenedores/redes al finalizar.
