# PROYECTO.md – CampusITSM

> Archivo de contexto para el repositorio. Toda IA o persona que programe vistas debe seguir estas reglas.
> Curso: Gestión de Servicios de TI · Universidad Tecnológica del Perú, Piura · 2026
> Institución del caso práctico (ficticia): Universidad Privada "Tallán", Piura. Cifras simuladas con fines académicos.

---

## 1. Qué es CampusITSM

Plataforma de gestión de servicios de TI para universidades privadas. Se diferencia de un ITSM tradicional en tres cosas:

1. **Priorización contextual:** la prioridad de una incidencia depende también del calendario académico (examen, entrega, matrícula).
2. **Constancias digitales verificables:** el estudiante obtiene un PDF con hash SHA-256 y QR que respalda la falla tecnológica.
3. **Alertas predictivas:** el sistema anticipa semanas de alta demanda cruzando histórico de tickets y calendario.

Cumple la Ley N.° 29733 y su reglamento (D.S. 016-2024-JUS): consentimiento, anonimización y auditoría.

## 2. Alcance de esta etapa

- Construir **las vistas en React** para una **demo en vivo** del escenario del caso práctico (martes de la semana 8, 10:00 a. m.).
- **Datos de prueba (mock)**. Todavía no hay base de datos conectada ni modelo de IA real.
- **Login simulado con selector de rol** (sin autenticación real).
- **Escritorio primero**; adaptación móvil después (RNF-08).
- Idioma de la interfaz: **español**. Tema **claro** únicamente.

Fuera de alcance por ahora: correo electrónico, modo oscuro, firma digital con validez legal, modelo de IA real, Postgres.

## 3. Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js (App Router) + React |
| Lenguaje | TypeScript (estricto) |
| Estilos | Tailwind CSS + shadcn/ui |
| Gráficos | Recharts |
| Íconos | lucide-react |
| Datos (ahora) | Mock en `src/data/` |
| Base de datos (después) | PostgreSQL (logs de IA en columnas JSONB, no NoSQL) |
| IA (ahora) | Funciones simuladas en `src/lib/ia/` |
| IA (después) | Servicio desacoplado detrás de la misma interfaz (RNF-11) |

## 4. Roles y navegación

Selector de rol en la pantalla de inicio de sesión. Cada rol ve un sidebar distinto.

| Rol | Qué puede hacer |
| --- | --- |
| `estudiante` | Reportar incidencias, ver sus tickets y su estado, solicitar y descargar constancias |
| `docente` | Igual que estudiante (misma vista) |
| `ti_agente` | Ver cola priorizada, ver detalle y desglose del puntaje, ajustar urgencia/impacto con justificación, resolver tickets, marcar "falla confirmada" |
| `ti_supervisor` | Todo lo del agente + dashboard de demanda y alertas |
| `administrador` | Calendario académico, factores y SLA, usuarios y roles, consentimientos, anonimización, auditoría |

Público (sin sesión): página de verificación de constancias `/verificar/[codigo]`. El Área académica no inicia sesión; verifica escaneando el QR.

> Supuesto a confirmar: el Área académica solo verifica por la página pública y no tiene login.

## 5. Regla de priorización (núcleo del sistema)

```
Puntaje = Urgencia (1–3) × Impacto técnico (1–3) × Factor académico
```

### 5.1 Escalas

**Urgencia**
- 1 = puede esperar
- 2 = afecta una tarea de hoy
- 3 = bloquea por completo ahora

**Impacto técnico**
- 1 = un usuario con alternativa
- 2 = un usuario sin alternativa
- 3 = grupo o servicio completo

### 5.2 Factor académico

| Factor | Condición detectada en el calendario |
| --- | --- |
| 1.0 | Actividad regular |
| 1.5 | Entrega con vencimiento en menos de 48 h |
| 1.7 | Matrícula en curso |
| 2.0 | Examen en curso o en menos de 24 h |

Si aplican varios factores a la vez, se usa **el mayor**.

### 5.3 Prioridad y SLA

| Prioridad | Puntaje | Respuesta (SLA) | Resolución (SLA) |
| --- | --- | --- | --- |
| P1 Crítica | ≥ 9 | 15 min | 2 h |
| P2 Alta | 5 a 8,9 | 1 h | 4 h |
| P3 Media | 3 a 4,9 | 4 h | 24 h |
| P4 Baja | < 3 | 8 h | 72 h |

Regla propuesta de escalamiento: si el factor académico es 2.0 y el examen empieza en menos de 2 h, el ticket se marca **"Examen inminente"** y se destaca visualmente en la cola, aunque el SLA de resolución general sea 2 h.

### 5.4 Quién asigna urgencia e impacto

- La **IA propone** ambos valores al clasificar el ticket.
- El **personal de TI puede ajustarlos**, con justificación obligatoria que queda en auditoría.
- El **estudiante no ve el puntaje**: solo ve prioridad (P1–P4), estado y tiempo estimado.
- El **personal de TI sí ve el desglose** `U × I × Factor = Puntaje`.

### 5.5 Función a implementar

```ts
// src/lib/prioridad.ts
export function calcularFactorAcademico(eventos: EventoAcademico[], ahora: Date): number { /* máximo aplicable */ }
export function calcularPuntaje(urgencia: 1|2|3, impacto: 1|2|3, factor: number): number { return urgencia * impacto * factor }
export function clasificarPrioridad(puntaje: number): 'P1'|'P2'|'P3'|'P4' { /* ≥9, ≥5, ≥3, <3 */ }
```

Debe tener pruebas unitarias con los tickets T1–T4 (sección 7).

## 6. Tipos principales (TypeScript)

```ts
export type Rol = 'estudiante'|'docente'|'ti_agente'|'ti_supervisor'|'administrador'
export type Prioridad = 'P1'|'P2'|'P3'|'P4'
export type EstadoTicket = 'registrado'|'clasificado'|'en_atencion'|'resuelto'|'cerrado'

export interface Ticket {
  id: string                // 'T1'...
  titulo: string
  descripcion: string
  categoria: string         // ej. 'Aula virtual – Acceso'
  reportadoPor: string      // id de usuario
  creadoEn: string          // ISO
  urgencia: 1|2|3
  impactoTecnico: 1|2|3
  factorAcademico: number
  puntaje: number
  prioridad: Prioridad
  estado: EstadoTicket
  fallaConfirmada: boolean
  evidencia?: string        // nombre de archivo / URL
  ajusteTI?: { por: string; justificacion: string; en: string }
}

export interface EventoAcademico {
  id: string
  tipo: 'examen'|'entrega'|'matricula'
  curso?: string
  inicio: string
  fin: string
  alcance: string           // carrera, ciclo o 'todos'
}

export interface Constancia {
  codigo: string
  ticketId: string
  emitidaEn: string
  hash: string              // SHA-256 simulado en la demo
  valida: boolean
}

export interface AlertaDemanda {
  id: string
  semana: number
  ticketsPrevistos: number
  mensaje: string
  generadaEn: string
}
```

## 7. Datos de prueba obligatorios (escenario del caso)

Martes de la semana 8 (parciales), 10:00 a. m. Cuatro reportes en 10 minutos.

| Ticket | Descripción | U × I | Factor | Puntaje | Prioridad | Orden sin contexto → con contexto |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | "No puedo entrar al aula virtual y mi examen empieza en 30 minutos" | 3 × 2 = 6 | 2.0 | 12 | P1 | 2.º → **1.º** |
| T2 | Red caída en el laboratorio B (40 alumnos, sin evaluación) | 3 × 3 = 9 | 1.0 | 9 | P1 | 1.º → 2.º |
| T3 | Error al subir una tarea que vence hoy a las 11:59 p. m. | 2 × 2 = 4 | 1.5 | 6 | P2 | 3.º → 3.º |
| T4 | El correo institucional no se sincroniza en el celular | 2 × 1 = 2 | 1.0 | 2 | P4 | 4.º → 4.º |

La demo debe **mostrar los dos órdenes** (por llegada y contextual) para evidenciar que T1 pasa al primer lugar.

Categoría simulada de T1: "Aula virtual – Acceso". La clasificación simulada debe responder en menos de 3 segundos (RNF-02).

Usuarios mock mínimos: 1 estudiante (dueño de T1), 1 docente, 2 agentes de TI, 1 supervisor, 1 administrador.

Calendario mock mínimo: examen parcial en curso (semana 8), entrega con vencimiento hoy 11:59 p. m., matrícula fuera de periodo.

## 8. Flujo del escenario (la demo en vivo)

1. El estudiante inicia sesión (selector de rol), acepta la política de datos y registra la incidencia en el formulario único, con captura opcional.
2. El motor de IA simulado clasifica el ticket en ≤ 3 s.
3. El sistema consulta el calendario, detecta un examen en menos de 24 h y aplica el factor 2.0.
4. El ticket aparece en la cola de TI como P1; el estudiante ve el estado en tiempo real.
5. TI resuelve la falla y marca "falla confirmada".
6. El estudiante solicita su constancia: PDF con firma institucional, hash SHA-256 y QR.
7. El docente o el Área académica escanea el QR y valida en la página pública.

## 9. Vistas y rutas

| Ruta | Vista | Rol |
| --- | --- | --- |
| `/login` | Selector de rol + aceptación de política de datos | Todos |
| `/incidencias/nueva` | Formulario único (máx. 3 clics, RNF-07) | Estudiante, docente |
| `/incidencias` | Mis tickets | Estudiante, docente |
| `/incidencias/[id]` | Detalle con línea de tiempo y estado | Estudiante, docente |
| `/constancias` | Solicitar y descargar constancias | Estudiante, docente |
| `/ti/cola` | Cola priorizada + comparación "por llegada" vs "contextual" | TI |
| `/ti/tickets/[id]` | Detalle con desglose del puntaje, ajuste, historial de recurrentes, resolver | TI |
| `/ti/dashboard` | Demanda prevista y alertas tempranas | Supervisor |
| `/admin/calendario` | Calendario académico (CSV o manual) | Administrador |
| `/admin/configuracion` | Factores académicos y SLA | Administrador |
| `/admin/usuarios` | Usuarios y roles | Administrador |
| `/admin/cumplimiento` | Consentimientos, anonimización, auditoría | Administrador |
| `/verificar/[codigo]` | Verificación pública de constancia | Público |

## 10. Constancias

- Se puede solicitar solo si el ticket está **resuelto** y TI marcó **falla confirmada**.
- No requiere aprobación adicional.
- **Contenido del PDF:** código, datos del estudiante, ticket, servicio afectado, hora de inicio y fin, actividad académica afectada, hash SHA-256 y código QR.
- En el prototipo se llama **"firma institucional"**. No usar "firma digital" con validez legal.
- **Página pública:** muestra solo si es válida, fecha, servicio y **nombre enmascarado** (ej. "J*** D***"). Nunca datos personales completos.
- Constancia alterada o código inexistente → mensaje claro de "no válida".

## 11. Calendario, alertas y notificaciones

- **Calendario:** lo carga el administrador (CSV o manual) con tipo, curso, inicio, fin y alcance. Precargado con la semana 8 del caso.
- **Dashboard (mock):** serie histórica + pronóstico de las próximas semanas, con picos en matrícula y parciales (semanas 8 y 16). El modelo real vendrá después.
- **Escenario 2 de alerta (semana 7):** el sistema alerta que la semana 8 (parciales) tendrá una demanda cercana a los picos históricos (hasta ~3 500 tickets/mes según el caso) y recomienda reforzar turnos de TI. Mostrarlo como tarjeta de alerta en el dashboard y en la campana.
- **Notificaciones:** solo dentro de la app (campana). Sin correo por ahora.

## 12. Paleta y diseño

| Uso | Color |
| --- | --- |
| Primario (botones, navegación) | `#1D4ED8` |
| Sidebar | `#1E3A8A` |
| Acento "verificado" y constancias | `#0D9488` |
| Fondo | `#F8FAFC` |
| Superficie | `#FFFFFF` |
| Texto | `#0F172A` |
| P1 Crítica | `#DC2626` |
| P2 Alta | `#EA580C` |
| P3 Media | `#CA8A04` (fondo claro, texto oscuro) |
| P4 Baja | `#64748B` |

Reglas de diseño:
- Definir los colores como tokens en Tailwind (`tailwind.config`) o variables CSS. No usar hex sueltos en los componentes.
- Los badges de prioridad llevan **texto + ícono**, nunca solo color (RNF-09).
- Contraste suficiente, foco visible en todo elemento interactivo, etiquetas en todos los campos.
- Escritorio primero (ancho base ≥ 1280 px); layouts con grid/flex que luego se adapten a móvil.

## 13. Estructura de carpetas

```
src/
  app/
    login/
    incidencias/
    constancias/
    ti/
    admin/
    verificar/[codigo]/
  components/
    ui/               # shadcn/ui
    compartidos/      # BadgePrioridad, TablaTickets, TarjetaEstado, SelectorRol
  data/               # mock: tickets, usuarios, calendario, alertas
  lib/
    prioridad.ts
    ia/               # clasificador simulado
    constancias.ts
    tipos.ts
  hooks/
```

## 14. Requerimientos que las vistas deben respetar

- **RF-01/02/03:** formulario único, login institucional (simulado), seguimiento de estado en tiempo real.
- **RF-04:** historial de incidencias para TI (recurrentes).
- **RF-05/06/07/08:** clasificación automática, calendario, priorización dinámica, ordenamiento de cola.
- **RF-09/10/11:** análisis histórico, alertas tempranas, dashboard de demanda.
- **RF-12/13/14:** constancia, firma institucional + QR/hash, evidencias.
- **RF-15/16/17:** consentimiento, anonimización, control de accesos.
- **RNF-02:** clasificación ≤ 3 s. **RNF-07:** máximo 3 clics para registrar. **RNF-08/09:** responsivo y accesible.

## 15. Reglas de trabajo en equipo (6 integrantes)

| N.º | Tramo | Carpeta principal |
| --- | --- | --- |
| 1 | **Base:** proyecto, layout por rol, selector de rol, tokens, tipos, mock T1–T4, componentes compartidos | `components/`, `data/`, `lib/tipos.ts` |
| 2 | **Portal estudiante/docente** | `app/incidencias/` |
| 3 | **Cola de TI y motor de prioridad** | `app/ti/cola`, `app/ti/tickets`, `lib/prioridad.ts` |
| 4 | **Constancias** | `app/constancias/`, `app/verificar/`, `lib/constancias.ts` |
| 5 | **Dashboard y alertas** | `app/ti/dashboard/` |
| 6 | **Administración y cumplimiento** | `app/login/`, `app/admin/` |

- Una rama por vista y pull request hacia `main`.
- Cada persona trabaja solo en su carpeta de rutas; los cambios en `components/compartidos`, `data/` y `lib/tipos.ts` se coordinan con quien hizo la base.
- Orden para la demo: base → nueva incidencia + cola de TI → constancias → dashboard → administración.

## 16. Instrucciones para la IA (Claude en Antigravity)

- Antes de crear una vista, lee este archivo y usa **solo** los tipos de la sección 6 y los datos de la sección 7.
- No inventes reglas de prioridad: usa `lib/prioridad.ts`.
- No muestres el puntaje al estudiante; sí a TI.
- Todos los textos de la interfaz en español.
- No uses `localStorage` para datos de negocio; usa estado de React y los mock de `src/data/`.
- No agregues dependencias fuera del stack sin avisar.
- Si algo no está definido aquí, pregunta antes de asumir.

## 17. Pendientes por confirmar

- Si el Área académica tiene login o solo verifica por la página pública.
- Regla de escalamiento "Examen inminente" (sección 5.3).
- Cuándo se conecta Postgres y el modelo de IA real.
- Identidad visual definitiva (logo y nombre institucional en la interfaz).