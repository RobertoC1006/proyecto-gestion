# Johan — cierre de clasificación y regresión de incidencias

Fecha: 25/11/2026 (America/Lima). Rama: `gestion-incidencias`. Base comprobada en `origin/main`: `d80171f`; se incorporó por avance rápido sobre `786154d`, sin rehacer los módulos de Roberto o Jasmine.

## Cambio de Johan

- Adaptador Groq versión 4: la proyección envía únicamente etiquetas técnicas cerradas. Elimina direcciones de contacto de la detección de servicios, distingue referencias generales a aula de «aula virtual» y agrega señales de degradación, bloqueo e impacto individual.
- Si no hay servicio reconocible o se detectan servicios en conflicto, la API no llama a Groq. Guarda el ticket con `revision_manual`, `aiFailureCode` (`insufficient_signals` o `ambiguous_signals`) y un cambio `ai.fallback` sin actor humano atribuido.
- Continúan vigentes las validaciones de categorías, urgencia e impacto; el presupuesto de 3 s para la llamada a Groq, la transacción del historial y la protección frente a respuestas tardías. El proveedor propone; TI conserva la evaluación y la resolución.
- La clave `GROQ_API_KEY` está solo en el `.env` privado del backend. No se registró ni copió al frontend. `GROQ_MODEL` usa `openai/gpt-oss-20b` por defecto. No se añadieron ni aplicaron migraciones.

## Evaluación reproducible

Dataset: `apps/api/test/fixtures/ticket-ai-evaluation.json`. Etiquetas sintéticas escritas antes de consultar cada conjunto. Servicio representa el componente averiado; urgencia 3 bloqueo, 2 degradación, 1 molestia; impacto 3 varias personas, 2 grupo/curso, 1 una persona. Los casos ambiguos llevan `null` y deben pasar a revisión manual. El ejecutor `apps/api/test/evaluate-ticket-ai.cjs` no abre PostgreSQL; mide la duración de cada clasificación desde Node, incluida la red para respuestas válidas. La latencia de una petición HTTP completa no se midió aquí.

| Conjunto | Adaptador | Casos | Servicio sobre todos | Servicio con categoría esperada | Urgencia | Impacto | Respuestas válidas | Revisión manual | Latencia válida p50/p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Reserva inicial | 3 | 14 | 13/14 | 10/11 | 10/11 | 7/11 | 10 | 4 | 819/1052 ms |
| Reserva nueva tras corrección | 4 | 13 | 13/13 | 11/11 | 7/11 | 10/11 | 11 | 2 | 941/1638 ms |

En la primera reserva, una etiqueta «correo» junto a un contacto ficticio produjo una ambigüedad falsa. La versión 4 corrigió esa detección y se midió con una reserva **nueva**, sin cambiar las etiquetas de la anterior. Las matrices de confusión, resultados por caso, códigos de fallo, modelo, versión y fecha están en `johan-ai-evaluation-20261125.json` y `johan-ai-evaluation-v4-20261125.json`. Hubo 3 casos derivados por ambigüedad y 1 por señales insuficientes en la primera reserva; 1 y 1 en la nueva. No se enviaron las descripciones completas a Groq.

Estos 27 reportes son ficticios y las etiquetas son provisionales del equipo, no un estándar validado por especialistas. El 85 % del proyecto sigue siendo una meta de evaluación más amplia. La urgencia de la versión 4 acertó 7/11; TI debe revisar esas propuestas y conviene ampliar el conjunto etiquetado antes de confiar en su precisión.

## Regresión y pantallas

- API: 151 pruebas aprobadas en PostgreSQL temporal con las 18 migraciones del repositorio; el runner PowerShell `scripts/verify-workflow.ps1` no lee `.env` y elimina su contenedor/red al terminar.
- Navegador: 62 pruebas existentes aprobadas con Chrome local; 24 de tickets/acceso y luego 5 de tickets repetidas para capturas. Una prueba nueva aprobada cubre P07–P08 con datos ficticios. Las rutas fixture abortan solicitudes API no previstas; sus capturas no son evidencia de escritura real.
- Capturas de P02–P08 a 1440 × 900 y 390 × 844 están en `.local/verification/johan/` (fixtures privadas, excluidas de Git). P08 móvil incluye otra captura de las acciones al desplazarse. Se compararon con `diseno/campusitsm/01_cu01_ingreso_reporte_v2.png` y `02_cu01_seguimiento_atencion_v2.png`. Se verificó ausencia de desbordamiento horizontal y cierre del menú lateral móvil. La interfaz vigente muestra los estados reales y declara los adjuntos aplazados, aunque el mockup ilustra un adjunto.
- La aplicación habitual se reconstruyó con `docker compose up --build -d --wait`: `api`, `web` y `predictions` saludables. El arranque normal no ejecutó `migrate`, `seed` ni `db push`. La URL privada se verificó como rol de API, esquema `campusitsm` y TLS, sin imprimirla.

## Recorrido autenticado en la base compartida

Con sesiones iniciadas personalmente por el usuario en estudiante y administrador TI, se registró **un** ticket ficticio en la base compartida: `INC-2026-B2609CEE78AA487F21C81B0F`. Esta prueba sí creó y actualizó datos de negocio en Supabase mediante la API normal; no ejecutó migraciones, semillas, `db push` ni cambió roles.

1. Estudiante: reporte general de aula virtual, código visible, «Propuesta por IA» y P3. El ticket reapareció tras recargar; el total personal pasó de 9 a 10. La URL de la cola de TI respondió «No tienes permiso» para esa sesión.
2. TI: la cola mostró el mismo ticket con urgencia 3 × impacto 1 × factor 1 = 3, prioridad P3. El detalle enseñó la explicación de Groq y el servicio declarado. TI confirmó la evaluación con motivo, se asignó como responsable autorizado, inició la primera atención humana y resolvió el caso ficticio dejando claro que no hubo falla tecnológica real. El historial añadió cuatro cambios humanos a la clasificación automática.
3. Estudiante: el panel mostró 10 incidencias y 2 resueltas; el filtro «Resueltas» incluyó el código. El detalle mostró responsable, historial, solución y plazos con las horas reales de primera atención y resolución.
4. Se reiniciaron solo `api` y `web` sin borrar volúmenes. Ambos volvieron a salud normal. La sesión estudiantil siguió válida al recargar y el ticket permaneció resuelto con su historial.

Consulta técnica de solo lectura del ticket: `aiProvider=groq`, `aiModel=openai/gpt-oss-20b`, `aiAdapterVersion=4`, `aiLatencyMs=1496`, `aiFailureCode=null`, `reportedService=service=aula_virtual`, `status=resuelto`, `classificationStatus=manual`, `version=6`, cinco cambios en `TicketChange`. `aiLatencyMs` incluye la llamada y trabajo inicial de la transacción; no representa la duración HTTP completa. La medición independiente del proveedor figura en la tabla anterior.

Los fallos de cuota, red, timeout, JSON inválido, señales insuficientes, concurrencia, idempotencia y aislamiento de otras identidades se probaron con dobles y PostgreSQL temporal. No se provocaron esos fallos en la base compartida ni se usó una segunda cuenta ajena para probar acceso cruzado allí.

## Demostración breve

1. Estudiante: registrar una incidencia ficticia general o de curso; anotar el código y abrir Mis incidencias. Mostrar servicio declarado, estado de IA/revisión, prioridad cuando exista y seguimiento.
2. TI: abrir Cola de TI; comparar orden técnico/contextual, consultar explicación y servicio original, ajustar con motivo si procede, iniciar atención y registrar solución.
3. Estudiante: actualizar el detalle y mostrar historial, responsable, plazos y resolución. El seguimiento consulta el servidor periódicamente; no usa eventos en tiempo real.

No se modificaron el esquema Prisma ni las migraciones. El informe y los cambios de esta rama quedan para revisión de Roberto antes de integrar en `main`.
