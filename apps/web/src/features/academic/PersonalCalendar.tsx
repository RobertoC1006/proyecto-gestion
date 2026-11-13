import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDots, CaretLeft, CaretRight, Plus, Clock, ArrowRight } from '@phosphor-icons/react'
import { Button, ButtonLink, Card, EmptyState, PageHeading } from '../../components/ui'
import { allPages, type AcademicEvent } from '../../lib/api/academic'
import { useAuth } from '../auth/AuthContext'
import { AcademicError } from './AcademicError'
import { addDays, dayKey, monday, dateLabel, time, weekLabel } from './dates'
import { typeLabels } from './CalendarPage'
import '../tickets/workflow.css'

export default function PersonalCalendar() {
 const {user}=useAuth()
 const teaching=!!user?.permissions.includes('academic:teach')
 const [start,setStart]=useState(()=>monday(dayKey(new Date())))
 const [selected,setSelected]=useState<string|null>(null)
 const params=new URLSearchParams({from:`${start}T00:00:00-05:00`,to:`${addDays(start,7)}T00:00:00-05:00`})
 const events=useQuery({queryKey:['academic',user?.id,'personal',start],queryFn:()=>allPages<AcademicEvent>(`me/events?${params}`)})
 const active=events.data?.find(e=>e.id===selected)
 const days=Array.from({length:7},(_,i)=>addDays(start,i))
 return <div className="content-stack workflow-page">
  <PageHeading title={teaching?'Mis actividades académicas':'Mi calendario académico'} subtitle={teaching?'Programa exámenes y entregas de tus cursos. Tus estudiantes verán las actividades de su sección.':'Tus exámenes y entregas, conectados con la atención de tus incidencias.'} action={teaching?<ButtonLink to="/profesor/calendario/nuevo"><Plus/>Programar actividad</ButtonLink>:undefined}/>
  <div className="workflow-context-banner"><CalendarDots size={28}/><div><strong>Tu actividad académica también cuenta</strong><p>Al reportar una falla, TI puede consultar los eventos que te corresponden para priorizar su atención.</p></div></div>
  <Card><div className="workflow-toolbar"><div className="workflow-inline"><Button variant="ghost" aria-label="Semana anterior" onClick={()=>setStart(addDays(start,-7))}><CaretLeft/></Button><h2>{weekLabel(start)}</h2><Button variant="ghost" aria-label="Semana siguiente" onClick={()=>setStart(addDays(start,7))}><CaretRight/></Button></div><Button variant="secondary" onClick={()=>setStart(monday(dayKey(new Date())))}>Hoy</Button></div>
   <div className="workflow-legend"><span className="event-type-label event-examen">Examen</span><span className="event-type-label event-entrega">Entrega</span><span className="event-type-label event-matricula">Matrícula</span><span>Hora de Lima</span></div>
  </Card>
  {events.error?<AcademicError error={events.error} retry={()=>void events.refetch()}/>:events.isPending?<Card role="status">Cargando actividades…</Card>:<div className="workflow-calendar-layout"><Card className="workflow-week"><div className="workflow-days">{days.map(day=><section className={`workflow-day ${day===dayKey(new Date())?'is-today':''}`} key={day}><h3><span>{new Date(`${day}T12:00:00-05:00`).toLocaleDateString('es-PE',{weekday:'short'})}</span><strong>{Number(day.slice(-2))}</strong></h3>{events.data?.filter(e=>dayKey(e.startsAt)<=day&&dayKey(e.endsAt)>=day).map(e=><button className={`workflow-event event-${e.type} ${selected===e.id?'is-selected':''}`} onClick={()=>setSelected(e.id)} key={e.id}><small>{typeLabels[e.type]} · {time(e.startsAt)}</small><strong>{e.title}</strong><span>{e.course?.name??'Institución'}</span></button>)}</section>)}</div>{!events.data?.length&&<EmptyState title="Semana sin actividades" description={teaching?'Programa un examen o una entrega de un curso asignado.':'Las actividades aparecerán cuando estén programadas para tus cursos y secciones.'}/>}</Card>
   <Card className="workflow-event-detail"><h2>Detalle de la actividad</h2>{active?<><span className={`event-type-label event-${active.type}`}>{typeLabels[active.type]}</span><h3>{active.title}</h3><p>{active.course?.name??'Actividad institucional'}</p><p>{active.section?.name??'Todas las secciones del alcance'}</p><p><Clock size={16}/> {dateLabel(active.startsAt)} · {time(active.startsAt)}–{time(active.endsAt)}</p>{user?.permissions.includes('tickets:create')&&<ButtonLink to={`/incidencias/nueva?${new URLSearchParams({...(active.courseId?{courseId:active.courseId}:{}),...(active.sectionId?{sectionId:active.sectionId}:{})})}`}>Reportar un problema <ArrowRight/></ButtonLink>}{teaching&&active.createdById===user?.id&&<ButtonLink variant="secondary" to={`/profesor/calendario/${active.id}/editar`}>Editar mi actividad</ButtonLink>}</>:<div className="workflow-placeholder"><CalendarDots size={42}/><p>Selecciona una actividad para ver su horario y reportar una dificultad.</p></div>}</Card></div>}
 </div>
}
