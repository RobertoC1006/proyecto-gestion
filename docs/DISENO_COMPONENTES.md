# Base visual de CampusITSM

Roberto pidió sustituir el acabado inicial del calendario por el diseño y los
componentes de [RobertoC1006/casos-gestion](https://github.com/RobertoC1006/casos-gestion),
adaptándolos a nuestras pantallas del mockup. Esta decisión corresponde a la rama
`calendario-academico` y sigue pendiente de integración autorizada en main.

Referencia revisada: commit
[`1d13d5c0d68ebe09d5c3b03d871dd8cc62455692`](https://github.com/RobertoC1006/casos-gestion/tree/1d13d5c0d68ebe09d5c3b03d871dd8cc62455692),
concordante con el HEAD publicado al iniciar la revisión. También se inspeccionó
la aplicación publicada en `soluciona-ti.vercel.app`, panel y formulario.

## Qué se reutiliza

| Fuente en casos-gestion | Adaptación en CampusITSM |
| --- | --- |
| `src/components/ui.tsx` | `apps/web/src/components/ui.tsx`: Button, ButtonLink, TextLink, Card, CardHeading, IconBubble, Field, Select, Notice, SupportIllustration, PageHeading, Breadcrumbs, EmptyState, FormError y Modal |
| `src/components/AppLayout.tsx` | Los mismos Sidebar/AppHeader/layout de CampusITSM pasan a usar la estructura de sidebar, institución, cabecera, cuenta y menú móvil de la referencia |
| `src/styles.css` | Se portaron los estilos de layout y componentes genéricos a `apps/web/src/app/globals.css`; los estilos específicos de incidentes no forman parte de esta base |
| `src/main.tsx` | Las mismas fuentes DM Sans y Manrope, alojadas por la aplicación, e IconContext para una sola familia Phosphor |

`Dialog` conserva su interfaz existente y delega en el Modal portado, sin una
segunda implementación de diálogos. Se retiró Lucide y se adaptaron los imports
anteriores para que navegación y contenido usen la misma familia de iconos.
Los componentes portados no dependen del dominio de incidentes de la referencia.
Notice admite atributos accesibles y PageHeading permite el símbolo del calendario.

La identidad gráfica usa CampusITSM y la institución ficticia Universidad Privada
Tallán. No se copiaron nombres de usuarios de demostración, sesiones, datos,
localStorage, reglas de prioridad, ciclo de vida ni servicios de Soluciona TI.

## Qué se conserva de los mockups

- P17: curso/sección y fuentes a la izquierda, semana con eventos en el centro y
  detalle del evento con sus acciones. En anchos intermedios el detalle pasa abajo;
  en móvil se muestra agenda y menú plegable.
- P18: formulario manual y vista previa a su lado, tipos/curso/sección/alcance,
  fechas, fuente y guardado. Se mantienen título/motivo y alta de catálogos que ya
  eran necesarios para el funcionamiento del calendario.
- Los permisos, validaciones, UTC/Lima, consultas y operaciones de la API existente
  no cambian. CSV, factores/SLA y otros módulos permanecen fuera de esta entrega.

Las vistas provisionales de otros módulos conservan su contenido; su compatibilidad
visual está aislada bajo `.legacy-view` en `provisional-pages.css`. El layout y los
componentes compartidos son únicos. Las próximas pantallas deben consumir `ui.tsx`
y extender los estilos de su propio dominio, sin crear otra familia de controles.

## Resultado comprobable

La revisión visual vigente y sus capturas están en
`docs/entregas/roberto-calendario-diseno-casos-gestion.md`.
Las capturas con datos llevan `fixture` en el nombre: comprueban la presentación,
no acreditan autenticación. La aplicación normal sigue bloqueando operaciones
académicas sin sesión hasta integrar identidad y permisos.
