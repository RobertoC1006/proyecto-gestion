# Calendario — adaptación del diseño de casos-gestion

Responsable: Roberto. Fecha: 6 de noviembre de 2026.
Rama: `calendario-academico`. PR de revisión: [#2, borrador](https://github.com/RobertoC1006/proyecto-gestion/pull/2).
**No integrar en main sin indicación expresa de Roberto.**

## Cambio solicitado

Se revisó el repositorio y la aplicación de Soluciona TI. Se portaron sus
componentes visuales reales, tipografías, iconos y estilos genéricos para P17/P18,
manteniendo la estructura y capacidades del mockup universitario. La procedencia
exacta y la correspondencia de archivos están en [DISENO_COMPONENTES.md](../DISENO_COMPONENTES.md).

La base del cambio es `06abbbd0eee2de26fff7a1ce974ca27f8cafa825`.
La referencia es `casos-gestion@1d13d5c0d68ebe09d5c3b03d871dd8cc62455692`.
Se conserva `main` en `196a2144aae253ca672eeeaf721c62204516245a`.

## Resultado

- Sidebar/cabecera, marca universitaria, menú móvil plegable y cuenta sin identidad
  ficticia. Fuentes DM Sans/Manrope y una única familia Phosphor en el frontend.
- Button/Card/Field/Select/Notice/PageHeading/Modal reutilizados desde la referencia;
  el diálogo anterior delega en el Modal común.
- P17 mantiene filtros, semana/agenda, selección y acciones de edición/eliminación.
- P18 mantiene validación, vista previa, alta de catálogos y guardado por API,
  ahora con tarjetas, campos y espaciado de la referencia.
- No se introducen datos de negocio en localStorage ni se copian reglas de incidentes.

## Comprobaciones

- Compilación TypeScript/Vite correcta; dependencias fijadas y auditoría npm sin alertas.
- Recorridos de interfaz del calendario, formulario inválido/UTC, edición/conflicto/
  eliminación, bloqueo real sin sesión y móvil sin desbordamiento.
- Menú móvil: apertura, navegación/cierre y Escape, con atributos accesibles.
- Se conserva el backend, el esquema y las migraciones ya probados en la entrega
  del calendario. No se modificó la base habitual ni se integró la rama en main.

Las pruebas de interfaz con datos interceptan respuestas con fixtures; las pruebas
de PostgreSQL documentadas en la entrega anterior son independientes. Sin el módulo
de identidad de Jasmine, el entorno real continúa respondiendo 401 al calendario
y no permite guardar desde el navegador. El cambio visual no sustituye esa integración.

## Capturas revisadas

Viewport de escritorio 1440 × 900 y móvil 390 × 844; captura completa desde el
inicio para revisar contenido largo sin cortar las acciones ni desplazar la cabecera.

- [P17 escritorio, datos de prueba](capturas/calendario/p17-casos-escritorio-fixture.png).
- [P18 escritorio, datos de prueba](capturas/calendario/p18-casos-escritorio-fixture.png).
- [P17 móvil, datos de prueba](capturas/calendario/p17-casos-movil-fixture.png).
- [P18 móvil, datos de prueba](capturas/calendario/p18-casos-movil-fixture.png).
- [P18 real sin sesión](capturas/calendario/p18-casos-acceso-real.png).

Referencia de estructura: lámina 5 del mockup final, P17 arriba izquierda y P18
arriba derecha. Referencia del acabado visual: Soluciona TI. Se conservan los
estados deshabilitados para importación/funciones aún no disponibles y no se
presentan datos ilustrativos como información autenticada.

## Revisar

`http://localhost:18083/admin/calendario` y `/admin/calendario/nuevo`.
Reproducir: levantar `campusitsm-calendar-review` en 18083 como indica README y
ejecutar `npm run test:e2e` desde `apps/web`. No cambiar a main para esta revisión.
