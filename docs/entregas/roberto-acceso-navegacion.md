# Acceso inicial y navegación por permisos

11 de noviembre de 2026. Rama local `acceso-navegacion`, desde main `f4a4457`.
Trabajo solicitado por Roberto al mostrar el dashboard sin sesión y el rechazo
del formulario abierto por `127.0.0.1:8080`. Incluye la indicación posterior de
recuperar únicamente el dashboard privado como inicio después de autenticarse.

## Problema y resultado

El layout se montaba sin esperar `/auth/me`; la portada mostraba datos de ejemplo
y un saludo fijo. El formulario rechazaba las escrituras desde la IP porque
APP_ORIGIN está configurado como `http://localhost:8080`.

- SessionBoundary espera la sesión antes de montar layout y pantallas privadas;
  sin sesión redirige a `/login`, y si la consulta falla ofrece reintento sin panel.
- PermissionBoundary impide montar pantallas ajenas a las capacidades de la API.
  Las constantes de acceso de interfaz se comparten con el menú, sin otro motor
  de roles ni modificaciones a los permisos del servidor.
- Sidebar filtra cada opción y omite el bloque administrativo si queda vacío.
  Modelos/Privacidad no se anuncian desde el menú mientras carecen de una
  capacidad específica publicada. Los módulos administrativos permitidos que
  todavía no tienen pantalla integrada siguen apareciendo como no disponibles.
- La raíz y el destino tras login abren el dashboard privado con el nombre y rol
  de la sesión. Se reemplazaron los contadores y tickets de ejemplo por accesos
  filtrados. Dashboard y Sidebar consumen `navigationFor`, el mismo catálogo
  de enlaces/descripciones y permisos. El calendario abre la ruta administrativa
  solo con `academic:manage`; los demás roles ven su calendario personal.
  Los módulos sin pantalla disponible muestran Próximamente sin enlace activo.
  No se implementó ni integró el módulo de usuarios de Jasmine.
- Nginx redirige la navegación HTML por `127.0.0.1` a `localhost` con el mismo
  puerto, ruta y parámetros. API y health conservan sus rutas sin redirección.
  Se mantienen la comprobación exacta de Origin y la protección CSRF del servidor.
- Login usa el dashboard como destino común privado. La verificación pública
  conserva su ruta fuera del layout privado; su contenido provisional no acredita
  implementación de constancias reales.

## Verificación

`npm run build` y reconstrucción Docker de web aprobados. Activación con
`docker compose up -d --no-deps --wait web` en la instalación existente.

25 pruebas Playwright aprobadas (`access.spec.cjs`, `auth.spec.cjs`,
`academic.spec.cjs`): sesión lenta/ausente/vencida, error y reintento, cinco roles,
permisos efectivos, direcciones directas no autorizadas sin consultas de datos,
login/registro/recuperación/logout, dashboard para los cinco roles, ausencia de
capacidades, recarga del inicio, calendario y navegación móvil. La comprobación
real de entrada por IP termina en `http://localhost:8080/login` con el formulario
disponible y sin layout; no usa respuestas sustituidas ni credenciales de usuario.
Revisión visual de escritorio y móvil realizada, con capturas que esperan el fin
de la transición del menú al cambiar el tamaño de pantalla.

Capturas nuevas en `.local/verification/acceso-navegacion/`; las que muestran un
usuario se identifican como fixture. Las pruebas de roles y escrituras sustituyen
respuestas en el navegador y no insertan datos en Supabase. No se probó un nuevo
inicio de sesión real con contraseña del usuario.

## Coordinación y límites

Interfaz local activa, cambios sin integrar ni publicar en main. No se modificaron
las ramas de Jasmine/Johan, roles de cuentas, esquema, migraciones ni credenciales.
El directorio `outputs/` ya existía sin seguimiento y se conservó.

Al integrar otros módulos, mantener SessionBoundary alrededor del layout privado
y PermissionBoundary alrededor de cada pantalla; asociar sus enlaces al mismo
permiso efectivo. El servidor debe seguir comprobando permiso e institución,
titular o equipo: el filtro visual no sustituye esa autorización. La pantalla P20
de Jasmine sigue pendiente de su revisión/integración; este arreglo no la entrega.
