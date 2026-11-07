# Roberto — semana 1, entrega previa Docker

> Informe histórico de la entrega indicada. Estado vigente: Roberto autorizó
> integrar el calendario/diseño en PR #2 y asumió P01, Supabase Auth y roles/permisos.
> Jasmine conserva administración, consentimiento y auditoría. Consultar
> [ESTADO_EQUIPO.md](../ESTADO_EQUIPO.md) y [CONTRATO_IDENTIDAD.md](../CONTRATO_IDENTIDAD.md).

Responsable: Roberto. Fecha: 6 de noviembre de 2026.
Módulo: `base-proyecto`. Esta entrega no completa toda la semana 1 ni el calendario.

## Implementado y comprobado

- Vistas existentes trasladadas a `apps/web`; los 17 archivos de `src/` conservan
  su contenido de `origin/front-vistas`. Sin rediseño ni pantallas nuevas.
- Backend NestJS modular, Prisma/PostgreSQL y servicio Python interno dentro de
  Docker. Nginx sirve React y reenvía las API. Solo web publica puerto local.
- Migración inicial institución/equipo, restricciones, semilla explícita
  transaccional/idempotente que conserva registros editados.
- Volúmenes PostgreSQL, archivos privados y modelos; salud de los cuatro servicios,
  migraciones terminadas antes de habilitar API, OpenAPI generado.
- Configuración ficticia sin credenciales reales, imágenes oficiales por digest,
  dependencias bloqueadas. Auditoría npm de API/web: cero alertas al verificar.
- Contexto actualizado, contratos disponibles/propuestos separados, planes y
  mockups finales incluidos para el equipo.

## Verificación

Prueba aislada `campusitsm-check-20261106162138`: correcta. Incluye arranque,
salud integral, contrato OpenAPI, ruta SPA, semilla repetida, conservación de edición,
rechazo de código duplicado/vacío y equipo huérfano, apagado/arranque sin borrar
volúmenes, persistencia de DB/archivos/modelos, migraciones al día y HTTP 503 al
detener Python seguido de recuperación. Contenedores de prueba retirados y
volúmenes de prueba conservados; instalación habitual sigue independiente.

Modo desarrollo: cuatro servicios saludables en proyecto aislado, API 200 y
ruta SPA 200 en puerto 18081; contenedores retirados conservando sus volúmenes.
Se verificó la compatibilidad del contrato OpenAPI con la recarga de TypeScript.

Clon limpio local del commit `aeeebbd1ac0e8b67e48d8f8288ab35a8782c3edf`:
construcción y prueba completa correctas (`campusitsm-check-clean-final-20261106`,
puerto 18082), sin `.env`, dependencias del host ni archivos sin versionar.
También pasó persistencia/semilla/restricciones y fallo/recuperación de Python.
Contenedores retirados; volúmenes de prueba conservados.

Los overrides bloqueados de multer, deepmerge-ts y effect corrigen alertas de
dependencias transitivas manteniendo las líneas NestJS 11 y Prisma 6. Se probaron
generación Prisma, migración, semilla, OpenAPI y ambos modos de ejecución.

## Git y coordinación

Origen `main`: `1501f5aaec13a77f3ebb79da52bf50d66e4e6678`.
Fuente integrada: `a4896261f92507155f5f153f7476fd29d99d631b` (`front-vistas`).
Ramas remotas revisadas: `main` y `front-vistas`; no otras ramas de módulos.
Se conserva `front-vistas` por no haberse confirmado que no sea trabajo activo.
Commit de código utilizable y verificado:
`aeeebbd1ac0e8b67e48d8f8288ab35a8782c3edf`.
PR de integración: [#1 — Base Docker compartida](https://github.com/RobertoC1006/proyecto-gestion/pull/1).
La integración usa merge conservando el historial del frontend. El commit de
código anterior identifica exactamente la base probada; los commits siguientes
de este módulo registran únicamente los resultados/documentación de cierre.

No hubo contacto con compañeros ni se acordaron contratos de identidad/tickets
en su nombre. `docs/CONTRATOS.md` reserva propuestas y detalla lo ya disponible.
Solo se crearon tablas de instalación; identidades/tickets quedan con Jasmine/Johan.

## Reproducir

```powershell
Copy-Item .env.example .env
docker compose up --build
docker compose --profile tools run --rm seed
```

Aplicación `http://localhost:8080`; API `/api/v1/health`; documentación `/api/docs`.
Prueba independiente: `./scripts/verify-base.ps1`. Desarrollo según README.
Sin nuevas pantallas funcionales: no corresponde acreditar fidelidad visual de
P17/P18 por conservar el frontend demostrativo anterior.

## Pendientes de la misma semana

Tras publicar base, coordinar identidad/permisos/auditoría con Jasmine y controles
compartidos/tickets con Johan antes de conectar el calendario. Calendario manual
P17/P18 requiere su propio módulo `calendario-academico`, no iniciado aquí.
IA/proveedor, tareas pg-boss, pronósticos, notificaciones y semanas 2–4 no se implementan.
No se ha publicado la aplicación en servidores ni enviado mensajes externos.
