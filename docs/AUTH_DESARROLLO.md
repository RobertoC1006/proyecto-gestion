# Acceso de CampusITSM durante el desarrollo

Rama `identidad-supabase`, iniciada desde main `02d10f557fdf81af81fdeef1ecf7fb7d210aaeed`.
Esta guía describe el código de la rama; no acredita que ya esté integrado en main.

## Qué se comparte

Supabase alojado: proyecto CampusITSM de la organización RobertoC1006, región
São Paulo, plan gratuito al crearlo el 7 de noviembre de 2026. Panel:
[CampusITSM](https://supabase.com/dashboard/project/npjibnlxepiwfermtcmo).
Solo se utiliza Auth. No se migraron las tablas de negocio a su PostgreSQL.

Cada integrante levanta su única instalación Docker `campusitsm` en
`http://localhost:8080`. Compartir Supabase comparte identidades de acceso,
no los perfiles, permisos, asociaciones o tickets de cada base local.
GitHub comparte código y migraciones, no las cuentas ni los datos de Docker.

Un mismo usuario confirmado recibe un perfil estudiante en cada instalación al
completar allí su primer login. Ese perfil usa su UUID de Supabase como ID canónico.
No se copian permisos de otra computadora ni metadata del navegador/proveedor.
Las cuentas reales ya creadas no requieren volver a registrarse en otro Docker.

## Preparar una computadora

1. Obtener la rama/entrega aprobada y ejecutar `scripts/prepare-auth.ps1`.
   Prepara `.env` y genera una clave local de cifrado de 32 bytes sin mostrarla.
2. Completar SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en el `.env` privado.
   Son la URL del proyecto y una clave publishable activa (también admite anon antigua).
   No se necesita service_role, clave secret ni contraseña del PostgreSQL remoto.
3. Mantener APP_ORIGIN=`http://localhost:8080` y AUTH_INSTITUTION_CODE=`UPT-DEMO`.
   La URL del navegador debe coincidir exactamente; no alternar localhost y 127.0.0.1.
4. Ejecutar `docker compose up --build -d --wait` y, una vez, la semilla explícita:
   `docker compose --profile tools run --rm seed`. Conserva registros existentes.
5. Abrir `/login`. Las migraciones se aplican antes de que arranque la API.

La configuración privada no se versiona ni se incluye en ZIP de planes. Cada
computadora genera su propia AUTH_ENCRYPTION_KEY. Conservarla para poder leer las
sesiones tras reiniciar; cambiarla invalida material cifrado existente. No la copiar
en chats ni registros. PostgreSQL y Python mantienen red interna; únicamente API
tiene salida adicional hacia Auth. No se publicaron nuevos puertos.

## Registro, confirmación y recuperación

Roberto eligió registro propio. Nuevas cuentas: correo/contraseña/nombre; sin selector
de rol, equipo o institución. Contraseña nueva de 10 a 128 caracteres.
Supabase gestiona la credencial. El perfil local se crea solo tras login confirmado.

Supabase envía un enlace. Debe abrirse en el mismo navegador y computadora donde se
solicitó, porque el verificador PKCE queda cifrado en el servidor y vinculado a una
cookie opaca. Solo el código de un solo uso llega al callback; los tokens se canjean
en NestJS y no se entregan a React. El callback redirige a una URL limpia de login.

Configuración del proyecto ya aplicada:

- Site URL: `http://localhost:8080`.
- Redirect URL exacta: `http://localhost:8080/api/v1/auth/callback`.
- Registro por correo habilitado y confirmación de correo conservada.
- Sin SMTP propio; plantillas estándar de Supabase, sin editar correos ni dominios.

Recuperación: «Olvidé mi contraseña», correo, enlace, formulario de nueva contraseña.
El acceso de recuperación dura diez minutos y solo permite cambiar esa contraseña;
no crea una sesión general de CampusITSM. Requiere Origin/CSRF. Al finalizar se
invalidan las sesiones locales de la cuenta. Supabase también recibe cierre global.
Un solo flujo de correo activo por navegador; solicitar otro reemplaza el anterior.

**Límite vigente:** el correo incluido de Supabase solo admite destinatarios miembros
de su equipo y tiene límites reducidos. Para que Johan/Jasmine y otras personas
puedan registrarse con correos externos hace falta un SMTP propio autorizado por
Roberto. No resolverlo añadiéndolos como administradores de Supabase ni desactivando
la confirmación. No se seleccionó ni contrató proveedor de correo.
[Condiciones del correo de Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

## Primer administrador de cada Docker

No se convierte automáticamente al primer visitante en administrador. Un operador
local debe elegir explícitamente una cuenta real que ya completó su primer login.
Configurar temporalmente BOOTSTRAP_USER_ID con ese UUID y ejecutar:
`docker compose --profile tools run --rm bootstrap-admin`.
También puede pasarse como variable únicamente al contenedor de la herramienta.
No acepta perfiles inexistentes ni funciona si ya hay un administrador activo.

El cambio registra IdentityChange e incrementa la versión de acceso; volver a iniciar
sesión para usar el nuevo rol. Los cambios posteriores son responsabilidad de P20/P21
de Jasmine, a través de IdentityDirectory.changeAccess. No crear otra autenticación.

## Pruebas y dependencias

`scripts/verify-auth.ps1`: pruebas PostgreSQL en un proyecto descartable sin puertos
web. Sustituye el proveedor solo dentro del ejecutable de prueba. Verifica sesiones,
CSRF, permisos, renovación concurrente, fallos, revocación, recuperación PKCE y
calendario. Al terminar elimina solo los recursos de prueba generados, no campusitsm.

`npm run test:e2e` en apps/web: pruebas de interfaz contra campusitsm:8080. Las
intercepciones identificadas como fixture no demuestran login externo. Las capturas
P01 con sufijo real muestran la pantalla normal, sin una sesión fingida.

Jasmine conserva consentimiento y auditoría global. No se inventó una política ni una
aceptación sin su versión real. AcademicChange/IdentityChange quedan guardados de forma
atómica, pendientes de su integración; no se implementaron sus pantallas ni reportes.
No se iniciaron CSV, SLA, IA, pronósticos ni otras semanas.
