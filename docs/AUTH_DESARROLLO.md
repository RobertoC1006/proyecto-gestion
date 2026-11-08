# Acceso de CampusITSM durante el desarrollo

Rama `identidad-supabase`, iniciada desde main `02d10f557fdf81af81fdeef1ecf7fb7d210aaeed`.
Esta guía describe el código de la rama; no acredita que ya esté integrado en main.

## Base compartida ya conectada

La rama base-compartida-supabase conserva esta identidad y trasladó negocio a
Supabase, esquema campusitsm, con UUID/perfiles/roles comunes. La instalación de
Roberto ya está conectada; no está integrada en main. Ver
[OPERACION_SUPABASE.md](OPERACION_SUPABASE.md) para preparar cada computadora,
conexiones privadas, comando manual de migración y claves de cifrado propias.

No copiar el .env completo de otro integrante. Ejecutar prepare-auth.ps1 para
generar la clave local; los instanceId de sesiones/PKCE impiden que otra
instalación los descifre o borre al cerrar su sesión. El perfil canónico compartido
se crea tras el primer login confirmado como estudiante. Permisos/asociaciones
se consultan en la misma base. La administración de Roberto ya fue conservada;
no repetir seed/bootstrap-admin en cada clon.

Johan/Jasmine ya tienen invitaciones Developer en la organización exclusiva
CampusITSM, pendientes de aceptación y configuración privada. Ver
[COLABORADORES_SUPABASE.md](COLABORADORES_SUPABASE.md). Cada Docker conserva sus archivos.
Solo NestJS conecta a PostgreSQL y Auth; el navegador recibe cookies opacas.

## Registro, confirmación y recuperación

Roberto eligió registro propio. Nuevas cuentas: correo/contraseña/nombre; sin selector
de rol, equipo o institución. Contraseña nueva de 10 a 128 caracteres.
Supabase gestiona la credencial. El perfil compartido se crea solo tras login confirmado.

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
invalidan las sesiones de aplicación de la cuenta en todas las instalaciones. Supabase también recibe cierre global.
Un solo flujo de correo activo por navegador; solicitar otro reemplaza el anterior.

**Límite vigente:** el correo incluido de Supabase solo admite destinatarios miembros
de su equipo y tiene límites reducidos. Tras aceptar las invitaciones, los correos
de miembro de Johan/Jasmine pueden usarse para esas pruebas, todavía no realizadas
en sus equipos. Para registrar personas ajenas al equipo hace falta SMTP propio
autorizado por Roberto. No resolverlo añadiéndolas como administradores ni desactivando
la confirmación. No se seleccionó ni contrató proveedor de correo.
[Condiciones del correo de Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

## Administración de cuentas

El administrador inicial ya existe en la base común, con asignación expresamente
autorizada y registrada en IdentityChange. El arranque no crea administradores.
Los cambios posteriores corresponden a P20/P21 de Jasmine usando
IdentityDirectory.changeAccess; no crear otro login ni otro motor de permisos.
La herramienta bootstrap-admin queda solo para una instalación vacía autorizada.

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

Entrega histórica de identidad: [resultado y capturas](entregas/roberto-semana-01-identidad.md).
