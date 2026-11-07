import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { Button, Card, EmptyState, PageHeading } from '../../components/ui'
import { allPages, type AcademicEvent } from '../../lib/api/academic'
import { AcademicError } from './AcademicError'
import { addDays, dayKey, monday, dateLabel, time, weekLabel } from './dates'
import { typeLabels } from './CalendarPage'
import '../auth/auth.css'

export default function PersonalCalendar() {
  const [start, setStart] = useState(() => monday(dayKey(new Date())))
  const params = new URLSearchParams({ from: `${start}T00:00:00-05:00`, to: `${addDays(start, 7)}T00:00:00-05:00` })
  const events = useQuery({ queryKey: ['academic', 'personal', start], queryFn: () => allPages<AcademicEvent>(`me/events?${params}`) })
  return <div className="content-stack"><PageHeading title="Mi calendario académico" subtitle="Eventos de tu institución y de los cursos y secciones a los que perteneces." />
    <Card><div className="calendar-toolbar"><Button variant="ghost" aria-label="Semana anterior" onClick={() => setStart(addDays(start, -7))}><CaretLeft /></Button><h2>{weekLabel(start)}</h2><Button variant="ghost" aria-label="Semana siguiente" onClick={() => setStart(addDays(start, 7))}><CaretRight /></Button></div></Card>
    {events.isPending ? <Card><p role="status">Cargando tus eventos…</p></Card> : events.error ? <AcademicError error={events.error} retry={() => { void events.refetch() }} /> : !events.data?.length ? <Card><EmptyState title="Sin eventos esta semana" description="Los eventos aparecerán cuando correspondan a tu institución o a tus cursos y secciones asignados." /></Card> : <div className="personal-events">{events.data.map(event => <Card className="personal-event" key={event.id}><span className="body-muted">{typeLabels[event.type]}</span><h2>{event.title}</h2><p>{dateLabel(event.startsAt)} · {time(event.startsAt)} – {time(event.endsAt)}</p>{event.course && <p className="body-muted">{event.course.name}{event.section ? ` · ${event.section.name}` : ''}</p>}</Card>)}</div>}
  </div>
}
