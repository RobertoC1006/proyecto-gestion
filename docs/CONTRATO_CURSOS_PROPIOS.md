# Cursos y secciones del titular — contrato para incidencias

11 de noviembre de 2026. Responsable: Roberto. Implementación en la rama
`cursos-propios`, desde `main@69a6907fb0b8ecf5fd5148e584aabb37c05b8895`.
Implementación `498d410`, integrada en main por autorización de Roberto el mismo día.
Estado de entrega: [ESTADO_EQUIPO.md](ESTADO_EQUIPO.md).

Este contrato resuelve la consulta académica solicitada por Johan en su corte 3.
Reutiliza AcademicCourse, AcademicSection y AcademicMembership, la identidad y la
sesión existentes. No añade tablas, permisos, migraciones ni otro catálogo.
El selector del formulario de incidencias lo conecta Johan en su módulo.

## Consultas disponibles

Prefijo `/api/v1`. Requieren la cookie de sesión existente. El servidor obtiene
titular e institución de esa sesión; no se reciben como parámetros. Las cuentas
activas de los roles existentes consultan únicamente sus asociaciones, incluido
un administrador: el acceso administrativo no amplía estas consultas personales.

| Ruta GET | Parámetros admitidos | Resultado |
| --- | --- | --- |
| `/academic/me/courses` | `page`, `pageSize` | Cursos con al menos una sección asociada al titular en su institución, sin duplicados aunque tenga varias secciones del mismo curso. |
| `/academic/me/sections` | `courseId` obligatorio; `page`, `pageSize` | Secciones de ese curso asociadas al titular en su institución. No devuelve todos los grupos del curso. |

`page`: entero 1–100000, por defecto 1. `pageSize`: entero 1–100, por defecto 100.
`courseId` debe ser UUID. Otros parámetros, incluidos `subjectId`, `ownerId` e
`institutionId`, se rechazan. Los parámetros repetidos que producen una lista
en lugar del UUID/entero esperado tampoco son válidos.

Respuesta común: `{items,total,page,pageSize}`. Los cursos se ordenan por nombre
e ID; las secciones por código e ID. `total` cuenta solo los objetos visibles
para el titular. Una página posterior a la última devuelve `items: []`.

- Curso: `{id,institutionId,code,name,createdAt}` (`CourseDto` existente).
- Sección: los mismos campos y `courseId` (`SectionDto` existente).
- No se devuelven personas, correos ni listas de integrantes.
- `Cache-Control: no-store`; cada consulta usa las asociaciones vigentes.

Una cuenta sin asociaciones recibe `200` con una lista vacía. Un UUID de curso
inexistente, de otro titular o de otra institución también devuelve una lista
vacía de secciones, sin revelar si ese curso existe.

Errores: `401 SESSION_REQUIRED` sin sesión válida, vencida o con cuenta
desactivada; `400 VALIDATION_ERROR` con `fields` para curso ausente/incorrecto,
paginación inválida o campos no admitidos. Una indisponibilidad de las
dependencias conserva el comportamiento de la API; no se representa como un
catálogo vacío satisfactorio.

## Conexión del formulario de Johan

Conservar estos dos alcances, independientes del servicio afectado:

1. **General:** no consultar ni exigir curso para enviar; `scope: general`,
   `courseId: null`, `sectionId: null`. Aula virtual o cualquier otro servicio
   también puede tener una incidencia general.
2. **Relacionado con un curso:** consultar los cursos propios y exigir elegir
   uno; después consultar sus secciones propias. `scope: curso`, `courseId`
   seleccionado y `sectionId` seleccionado o `null` porque la sección es opcional.

Al cambiar de curso, borrar la sección seleccionada antes de cargar las nuevas
opciones. Si no hay cursos, mantener disponible General y explicar que no hay
asociaciones académicas; no pedir al usuario un UUID ni crear cursos ficticios.
Un error de consulta debe distinguirse de una respuesta vacía y permitir reintento.

Se puede reutilizar directamente `allPages` y los tipos del cliente existente:

```ts
import { allPages, type Course, type Section } from '../../../lib/api/academic'

const courses = await allPages<Course>('me/courses')
const sections = await allPages<Section>(
  `me/sections?courseId=${encodeURIComponent(course.id)}`,
)
```

El ejemplo usa el import de P03 y asume que `course` es la opción ya elegida.
No crear otro cliente HTTP: se conserva la cookie
de sesión común. Si se usa TanStack Query, incluir el ID del usuario en las claves
de consulta y el ID del curso en las de secciones. Recorrer las páginas evita
ocultar opciones al superar 100 registros.

La API de tickets debe seguir validando institución y asociación al registrar;
mostrar una opción en el navegador no sustituye esa comprobación. Las rutas
administrativas actuales permanecen separadas y requieren administración.

## Validación y alcance pendiente

`scripts/verify-auth.ps1`: 29 pruebas aprobadas, sin fallos, en PostgreSQL local
descartable. Se probó por HTTP con sesiones de aplicación y proveedor externo
sustituido solo dentro de las pruebas: estudiante, docente y otra institución;
paginación; duplicados; asociación retirada; cuenta desactivada; parámetros
inválidos y rechazo de identidad inventada. Compilación API y tipos web aprobados.
OpenAPI y los tipos del navegador se regeneraron desde NestJS.

Esta entrega no implementa el selector en la rama de Johan, adjuntos, su migración
de tickets, prioridad/SLA, consentimiento ni auditoría global. No aplica cambios
a la estructura o los datos de Supabase. La entrega completa está en
[roberto-semana-01-cursos-propios.md](entregas/roberto-semana-01-cursos-propios.md).
