import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  CalendarDots as CalendarDays,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  Clock as Clock3,
  GraduationCap,
  PencilSimple as Pencil,
  Plus,
  ArrowsClockwise as RefreshCw,
  Trash as Trash2,
  UploadSimple as Upload,
  Users,
} from '@phosphor-icons/react'
import {
  allPages,
  api,
  type AcademicEvent,
  type Course,
  type Section,
} from '../../lib/api/academic'
import { Dialog } from '../../components/Dialog'
import {
  Button,
  ButtonLink,
  Card,
  CardHeading,
  Field,
  Notice,
  Select,
} from '../../components/ui'
import { Funnel, Info, CheckCircle } from '@phosphor-icons/react'
import { AcademicBanner } from './AcademicBanner'
import { AcademicError } from './AcademicError'
import { addDays, dateLabel, dayKey, monday, time, weekLabel } from './dates'

export const typeLabels = {
  examen: 'Examen',
  entrega: 'Entrega',
  matricula: 'Matrícula',
}
const initialDay = () => {
  const day = new URLSearchParams(location.search).get('date')
  return day &&
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    !Number.isNaN(Date.parse(day))
    ? day
    : dayKey(new Date())
}
type Segment = {
  event: AcademicEvent
  start: number
  end: number
  lane: number
}
function segments(events: AcademicEvent[], day: string) {
  const base = new Date(`${day}T00:00:00-05:00`).getTime()
  const result: Segment[] = events
    .map((event) => ({
      event,
      start: Math.max(0, (Date.parse(event.startsAt) - base) / 60000),
      end: Math.min(1440, (Date.parse(event.endsAt) - base) / 60000),
      lane: 0,
    }))
    .filter((e) => e.start < 1440 && e.end > 0)
  const ends: number[] = []
  for (const segment of result.sort(
    (a, b) => a.start - b.start || a.end - b.end,
  )) {
    const free = ends.findIndex((end) => end <= segment.start)
    segment.lane = free === -1 ? ends.length : free
    ends[segment.lane] = segment.end
  }
  return { result, lanes: Math.max(1, ends.length) }
}

export default function CalendarPage() {
  const [start, setStart] = useState(() => monday(initialDay()))
  const [courseId, setCourseId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [manual, setManual] = useState(true)
  const [view, setView] = useState('week')
  const [selected, setSelected] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState('')
  const client = useQueryClient()
  const courses = useQuery({
    queryKey: ['academic', 'courses'],
    queryFn: () => allPages<Course>('courses'),
  })
  const sections = useQuery({
    queryKey: ['academic', 'sections', courseId],
    queryFn: () =>
      allPages<Section>(
        `sections?${new URLSearchParams(courseId ? { courseId } : {})}`,
      ),
  })
  const query = new URLSearchParams({
    from: `${start}T00:00:00-05:00`,
    to: `${addDays(start, 7)}T00:00:00-05:00`,
    ...(courseId ? { courseId } : {}),
    ...(sectionId ? { sectionId } : {}),
  })
  const eventsQuery = useQuery({
    queryKey: ['academic', 'events', start, courseId, sectionId],
    queryFn: () => allPages<AcademicEvent>(`events?${query}`),
  })
  const events = manual ? (eventsQuery.data ?? []) : []
  const active = events.find((event) => event.id === selected) ?? null
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(start, index)),
    [start],
  )
  const daySegments = days.map((day) => segments(events, day))
  const minHour = Math.min(
    8,
    ...daySegments.flatMap((day) =>
      day.result.map((segment) => Math.floor(segment.start / 60)),
    ),
  )
  const maxHour = Math.max(
    16,
    ...daySegments.flatMap((day) =>
      day.result.map((segment) => Math.ceil(segment.end / 60)),
    ),
  )
  const rows = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i)
  const error = eventsQuery.error ?? courses.error ?? sections.error
  const loading = eventsQuery.isPending
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['academic'] })
  }
  const remove = useMutation({
    mutationFn: () =>
      api(`events/${active!.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ expectedVersion: active!.version, reason }),
      }),
    onSuccess: () => {
      setSelected(null)
      setDeleting(false)
      setReason('')
      setNotice('Evento eliminado.')
      refresh()
    },
  })

  const agenda = (mobile = false) => (
    <div className={`academic-agenda ${mobile ? 'mobile-only' : ''}`}>
      {days.map((day) => (
        <section key={day}>
          <h3>{dateLabel(`${day}T12:00:00-05:00`)}</h3>
          {events
            .filter(
              (e) =>
                Date.parse(e.startsAt) <
                  Date.parse(`${addDays(day, 1)}T00:00:00-05:00`) &&
                Date.parse(e.endsAt) > Date.parse(`${day}T00:00:00-05:00`),
            )
            .map((event) => (
              <button
                key={event.id}
                className={`agenda-event event-${event.type}`}
                onClick={() => setSelected(event.id)}
              >
                <span>{time(event.startsAt)}</span>
                <strong>{event.title}</strong>
                <span>{typeLabels[event.type]}</span>
              </button>
            ))}
        </section>
      ))}
    </div>
  )
  return (
    <section className="academic-page">
      <AcademicBanner />
      {notice && (
        <Notice icon={CheckCircle} role="status" className="academic-message">
          {notice}
        </Notice>
      )}
      {error && <AcademicError error={error} retry={refresh} />}
      <div className="academic-workspace">
        <Card className="academic-filters">
          <CardHeading title="Filtros" icon={Funnel} />
          <div className="form-stack">
            <Field label="Curso">
              <Select
                id="filter-course"
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value)
                  setSectionId('')
                  setSelected(null)
                }}
              >
                <option value="">Todos los cursos</option>
                {courses.data?.map((course) => (
                  <option value={course.id} key={course.id}>
                    {course.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sección">
              <Select
                id="filter-section"
                value={sectionId}
                onChange={(e) => {
                  setSectionId(e.target.value)
                  setSelected(null)
                }}
              >
                <option value="">Todas las secciones</option>
                {sections.data?.map((section) => (
                  <option value={section.id} key={section.id}>
                    {section.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="academic-filter-group">
            <h3>Fuentes</h3>
            <label className="check-label">
              <input
                type="checkbox"
                checked={manual}
                onChange={(e) => setManual(e.target.checked)}
              />
              Carga manual
            </label>
            <label className="check-label check-label--disabled">
              <input type="checkbox" disabled />
              Importación
            </label>
          </div>
          <div className="academic-filter-group">
            <h3>Leyenda de eventos</h3>
            {Object.entries(typeLabels).map(([type, label]) => (
              <p className={`legend-row event-${type}`} key={type}>
                <span />
                {label}
              </p>
            ))}
          </div>
        </Card>
        <div className="academic-calendar-content">
          <div className="academic-toolbar">
            <ButtonLink to="/admin/calendario/nuevo">
              <Plus size={19} />
              Nuevo evento
            </ButtonLink>
            <Button
              variant="secondary"
              disabled
              title="La importación CSV se habilitará en una próxima entrega"
              icon={Upload}
            >
              Importar CSV
            </Button>
            <Button
              variant="secondary"
              onClick={refresh}
              disabled={eventsQuery.isFetching}
            >
              <RefreshCw
                size={19}
                className={eventsQuery.isFetching ? 'spinning' : ''}
              />
              Actualizar
            </Button>
          </div>
          <div className="academic-calendar-and-detail">
            <Card className="academic-board-container" aria-busy={loading}>
              <div className="academic-weekbar">
                <div className="academic-week-controls">
                  <button
                    className="icon-button"
                    aria-label="Semana anterior"
                    onClick={() => setStart(addDays(start, -7))}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2>{weekLabel(start)}</h2>
                  <button
                    className="icon-button"
                    aria-label="Semana siguiente"
                    onClick={() => setStart(addDays(start, 7))}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="academic-view-controls">
                  <Button
                    variant="ghost"
                    onClick={() => setStart(monday(dayKey(new Date())))}
                  >
                    Hoy
                  </Button>
                  <Select
                    aria-label="Vista del calendario"
                    value={view}
                    onChange={(e) => setView(e.target.value)}
                  >
                    <option value="week">Vista semanal</option>
                    <option value="agenda">Agenda</option>
                  </Select>
                </div>
              </div>
              {loading && (
                <p role="status" className="academic-empty">
                  Cargando eventos…
                </p>
              )}
              {!loading && !error && events.length === 0 && (
                <p className="academic-empty">
                  No hay eventos en esta semana. Crea uno o cambia los filtros.
                </p>
              )}
              {view === 'agenda' ? (
                agenda()
              ) : (
                <>
                  <div
                    className="academic-week-board"
                    role="group"
                    aria-label="Calendario semanal"
                  >
                    <div className="calendar-time-head" />
                    {days.map((day) => (
                      <div
                        key={day}
                        className={`calendar-day-head ${day === dayKey(new Date()) ? 'today' : ''}`}
                      >
                        <strong>
                          {new Date(`${day}T12:00:00Z`).toLocaleDateString(
                            'es-PE',
                            { weekday: 'short', timeZone: 'America/Lima' },
                          )}
                        </strong>
                        <span>
                          {new Date(`${day}T12:00:00Z`).toLocaleDateString(
                            'es-PE',
                            {
                              day: 'numeric',
                              month: 'short',
                              timeZone: 'America/Lima',
                            },
                          )}
                        </span>
                      </div>
                    ))}
                    <div
                      className="calendar-hours"
                      style={{ height: rows.length * 48 }}
                    >
                      {rows.map((hour) => (
                        <span key={hour} style={{ top: (hour - minHour) * 48 }}>
                          {String(hour).padStart(2, '0')}:00
                        </span>
                      ))}
                    </div>
                    {days.map((day, index) => (
                      <div
                        key={day}
                        className={`calendar-day-column ${day === dayKey(new Date()) ? 'today' : ''}`}
                        style={{ height: rows.length * 48 }}
                      >
                        {daySegments[index].result.map(
                          ({ event, start: eventStart, end, lane }) => (
                            <button
                              key={event.id}
                              onClick={() => setSelected(event.id)}
                              className={`calendar-event event-${event.type} ${event.id === selected ? 'selected' : ''}`}
                              aria-label={`${event.title}, ${dateLabel(event.startsAt)}, ${time(event.startsAt)} a ${time(event.endsAt)}`}
                              style={{
                                top: (eventStart - minHour * 60) * 0.8 + 2,
                                height: Math.max(
                                  24,
                                  (end - eventStart) * 0.8 - 4,
                                ),
                                left: `calc(${(lane * 100) / daySegments[index].lanes}% + 3px)`,
                                width: `calc(${100 / daySegments[index].lanes}% - 6px)`,
                              }}
                            >
                              <strong>{event.title}</strong>
                              <span>{time(event.startsAt)}</span>
                            </button>
                          ),
                        )}
                      </div>
                    ))}
                  </div>
                  {agenda(true)}
                </>
              )}
              <div className="academic-calendar-caption">
                <Info size={16} />
                <span>Las horas se muestran en Lima.</span>
              </div>
            </Card>
            <Card className="academic-event-detail">
              <CardHeading title="Detalle del evento" icon={CalendarDays} />
              {active ? (
                <>
                  <span className={`event-type-label event-${active.type}`}>
                    {typeLabels[active.type]}
                  </span>
                  <h3>{active.title}</h3>
                  <dl>
                    <div>
                      <BookOpen size={19} />
                      <dt>Curso</dt>
                      <dd>{active.course?.name ?? 'Todos los cursos'}</dd>
                    </div>
                    <div>
                      <GraduationCap size={19} />
                      <dt>Sección</dt>
                      <dd>{active.section?.name ?? 'Todas las secciones'}</dd>
                    </div>
                    <div>
                      <CalendarDays size={19} />
                      <dt>Fecha</dt>
                      <dd>{dateLabel(active.startsAt)}</dd>
                    </div>
                    <div>
                      <Clock3 size={19} />
                      <dt>Inicio</dt>
                      <dd>{time(active.startsAt)}</dd>
                    </div>
                    <div>
                      <Clock3 size={19} />
                      <dt>Fin</dt>
                      <dd>
                        {dayKey(active.endsAt) !== dayKey(active.startsAt) &&
                          `${dateLabel(active.endsAt)} · `}
                        {time(active.endsAt)}
                      </dd>
                    </div>
                    <div>
                      <Users size={19} />
                      <dt>Alcance</dt>
                      <dd>
                        {active.scope === 'institution'
                          ? 'Toda la institución'
                          : active.scope === 'course'
                            ? 'Usuarios asociados al curso'
                            : 'Usuarios asociados a la sección'}
                      </dd>
                    </div>
                  </dl>
                  <div className="academic-detail-actions">
                    <ButtonLink
                      variant="secondary"
                      to={`/admin/calendario/${active.id}/editar`}
                    >
                      <Pencil size={18} />
                      Editar
                    </ButtonLink>
                    <Button
                      variant="ghost"
                      className="academic-delete-button"
                      icon={Trash2}
                      onClick={() => {
                        remove.reset()
                        setDeleting(true)
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="academic-detail-placeholder">
                  <CalendarDays size={40} weight="duotone" />
                  <p>Selecciona un evento para consultar sus datos.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      {deleting && active && (
        <Dialog title="Eliminar evento" onClose={() => setDeleting(false)}>
          <p>
            Se eliminará <strong>{active.title}</strong>. Su registro de cambios
            se conservará.
          </p>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault()
              remove.mutate()
            }}
          >
            <Field label="Motivo de eliminación">
              <textarea
                className="input"
                id="delete-reason"
                minLength={5}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </Field>
            {remove.error && <AcademicError error={remove.error} />}
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setDeleting(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={remove.isPending}
              >
                {remove.isPending ? 'Eliminando…' : 'Eliminar evento'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  )
}
