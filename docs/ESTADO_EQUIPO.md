# Estado del equipo

## Avance en rama, sin integrar

`calendario-academico`, desde `196a2144aae253ca672eeeaf721c62204516245a`.
Roberto pidió conservarlo fuera de main hasta su autorización expresa.
GitHub no tenía ramas de módulos de compañeros; Roberto confirmó que aún no las
crearon y autorizó empezar los componentes de su calendario siguiendo los mockups,
sin tomar la vista provisional como diseño final.

Incluye dominio, migración, contrato y pantallas P17/P18. Reutiliza/modifica los
mismos Sidebar/AppHeader y controles; añade un único diálogo compartido. Cambios
de navegación/cabecera y contrato deberán revisarse con Johan/Jasmine al integrar
sus módulos. Sin servicios de identidad/tickets implementados en su nombre.
Detalle de alcance, pruebas y límites: `docs/entregas/roberto-semana-01-calendario.md`.

La aplicación normal deniega acceso académico mientras no se conecten sesión,
protección de escritura y directorio de usuarios. Las pruebas inyectan identidad
solo dentro del ejecutable de prueba. No existe acceso de administrador por
cabeceras, selector de roles ni credenciales de demostración en la aplicación.

## Base publicada anteriormente

Fecha: 6 de noviembre de 2026. Responsable: Roberto. Módulo: base Docker.
Rama: `base-proyecto`. Base GitHub verificada:
`1501f5aaec13a77f3ebb79da52bf50d66e4e6678` (`origin/main`).
Frontend integrado preservando historia desde
`a4896261f92507155f5f153f7476fd29d99d631b` (`origin/front-vistas`), movido a `apps/web`.

Base utilizable verificada: `aeeebbd1ac0e8b67e48d8f8288ab35a8782c3edf`.
Integración: [PR #1](https://github.com/RobertoC1006/proyecto-gestion/pull/1),
conservando historia. Resultados completos en `docs/entregas/roberto-semana-01-base.md`:
construcción desde clon limpio, modo desarrollo, salud, migraciones, semilla,
restricciones, persistencia y recuperación ante fallo de Python correctos.
Los compañeros deben obtener `main` después de la integración de esa PR.
No se enviaron mensajes externos al equipo.

| Persona | Siguiente trabajo | Dependencias |
| --- | --- | --- |
| Roberto | `calendario-academico`, después de integrar base | Identidad/permisos/auditoría de Jasmine; controles de Johan |
| Johan | Incidencias y componentes según su plan | Base, coordinación de identidad/contexto y reutilizar componentes |
| Jasmine | Acceso/usuarios según su plan | Base, acuerdo de identidad/equipo y auditoría |

Ramas remotas revisadas inicialmente: solo `main` y `front-vistas`. No se identificó
otra rama de módulos, lo que no prueba ausencia de trabajo local de compañeros.
Se conserva `front-vistas` porque no se confirmó que deje de ser trabajo activo.

Base: DB, backend/API, frontend y Python dentro de Docker. Solo salud/OpenAPI y
esquema institución/equipo; sin cuentas, tickets, calendario ni pronósticos reales.
Contratos futuros en `docs/CONTRATOS.md` son propuestas por coordinar.
Cada integrante desarrolla frontend/backend/pruebas de sus módulos y usa sus
propios volúmenes locales, sin conectarse a la computadora de Roberto.

Se incluyen planes y mockups finales. Se conservan los documentos recibidos:
su fotografía de planificación no reemplaza los resultados de la entrega actual.
