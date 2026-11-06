import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CalendarDays, Check, Info, PencilLine, Plus, Upload, Users } from 'lucide-react';
import { allPages, api, ApiError, type AcademicEvent, type Course, type EventInput, type Section } from '../../lib/api/academic';
import { Dialog } from '../../components/Dialog';
import { AcademicBanner } from './AcademicBanner';
import { AcademicError } from './AcademicError';
import { dateLabel, dayKey, localInput, time, utcInput } from './dates';
import { typeLabels } from './CalendarPage';

type Draft = { title: string; type: EventInput['type']; scope: EventInput['scope']; courseId: string; sectionId: string; startsAt: string; endsAt: string; reason: string };
const empty: Draft = { title: '', type: 'examen', scope: 'section', courseId: '', sectionId: '', startsAt: '', endsAt: '', reason: '' };

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [form, setForm] = useState<Draft>(empty);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [catalog, setCatalog] = useState<'course' | 'section' | null>(null);
  const [catalogForm, setCatalogForm] = useState({ code: '', name: '', reason: '' });
  const courses = useQuery({ queryKey: ['academic', 'courses'], queryFn: () => allPages<Course>('courses') });
  const sections = useQuery({ queryKey: ['academic', 'sections', form.courseId], queryFn: () => allPages<Section>(`sections?courseId=${form.courseId}`), enabled: !!form.courseId });
  const current = useQuery({ queryKey: ['academic', 'event', id], queryFn: () => api<AcademicEvent>(`events/${id}`), enabled: !!id });
  useEffect(() => { if (current.data) {
    const row = current.data;
    setForm({ title: row.title, type: row.type, scope: row.scope, courseId: row.courseId ?? '', sectionId: row.sectionId ?? '', startsAt: localInput(row.startsAt), endsAt: localInput(row.endsAt), reason: '' });
  } }, [current.data]);
  useEffect(() => { const first = Object.entries(fields).find(([, message]) => !!message)?.[0]; if (first) document.getElementById(`event-${first}`)?.focus(); }, [fields]);
  const blocked = !!courses.error || !!current.error || courses.isPending || (!!id && current.isPending);
  const save = useMutation({ mutationFn: (payload: EventInput) => api<AcademicEvent>(id ? `events/${id}` : 'events', { method: id ? 'PATCH' : 'POST', body: JSON.stringify({ ...payload, ...(id ? { expectedVersion: current.data?.version } : {}) }) }),
    onSuccess: row => { void client.invalidateQueries({ queryKey: ['academic'] }); navigate(`/admin/calendario?date=${dayKey(row.startsAt)}`); },
    onError: error => { if (error instanceof ApiError) setFields(error.fields); } });
  const createCatalog = useMutation({ mutationFn: () => api<Course | Section>(catalog === 'course' ? 'courses' : 'sections', { method: 'POST', body: JSON.stringify({ ...catalogForm, ...(catalog === 'section' ? { courseId: form.courseId } : {}) }) }),
    onSuccess: row => { void client.invalidateQueries({ queryKey: ['academic', catalog === 'course' ? 'courses' : 'sections'] });
      if (catalog === 'course') setForm(previous => ({ ...previous, courseId: row.id, sectionId: '' })); else setForm(previous => ({ ...previous, sectionId: row.id }));
      setCatalog(null); setCatalogForm({ code: '', name: '', reason: '' }); } });
  const change = (key: keyof Draft, value: string) => { setForm(previous => ({ ...previous, [key]: value, ...(key === 'courseId' ? { sectionId: '' } : {}), ...(key === 'scope' && value === 'institution' ? { courseId: '', sectionId: '' } : {}), ...(key === 'scope' && value === 'course' ? { sectionId: '' } : {}) })); setFields(previous => ({ ...previous, [key]: '' })); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'Escribe el título del evento.';
    if (!form.startsAt) errors.startsAt = 'Indica la fecha y hora de inicio.';
    if (!form.endsAt || form.endsAt <= form.startsAt) errors.endsAt = 'El fin debe ser posterior al inicio.';
    if (form.scope !== 'institution' && !form.courseId) errors.courseId = 'Selecciona un curso.';
    if (form.scope === 'section' && !form.sectionId) errors.sectionId = 'Selecciona una sección.';
    if (form.reason.trim().length < 5) errors.reason = 'Explica el motivo con al menos 5 caracteres.';
    if (Object.keys(errors).length) { setFields(errors); return; }
    setFields({}); save.reset();
    save.mutate({ ...form, title: form.title.trim(), courseId: form.courseId || null, sectionId: form.sectionId || null, startsAt: utcInput(form.startsAt), endsAt: utcInput(form.endsAt) });
  };
  const hint = (name: string) => fields[name] ? <small className="field-error" id={`error-${name}`}>{fields[name]}</small> : null;
  const inputProps = (name: keyof Draft) => ({ id: `event-${name}`, 'aria-invalid': !!fields[name], 'aria-describedby': fields[name] ? `error-${name}` : undefined });
  const course = courses.data?.find(row => row.id === form.courseId);
  const section = sections.data?.find(row => row.id === form.sectionId);
  const previewStart = form.startsAt && !Number.isNaN(Date.parse(`${form.startsAt}-05:00`)) ? utcInput(form.startsAt) : null;
  const previewEnd = form.endsAt && !Number.isNaN(Date.parse(`${form.endsAt}-05:00`)) ? utcInput(form.endsAt) : null;
  return <section className="academic-page"><AcademicBanner form editing={!!id} /><div className="academic-form-tabs"><span className="active"><PencilLine size={18} />Manual</span><button className="secondary-button" disabled title="La importación CSV se habilitará en una próxima entrega"><Upload size={18} />Importar CSV</button></div>
    {(courses.error || current.error) && <AcademicError error={courses.error ?? current.error} retry={() => { void courses.refetch(); if (id) void current.refetch(); }} />}
    <div className="academic-form-layout"><form className="form-section academic-event-form" onSubmit={submit} noValidate><h2>{id ? 'Editar evento académico' : 'Evento académico'}</h2><fieldset disabled={blocked || save.isPending}>
      <div className="field"><label htmlFor="event-title">Título del evento <span aria-hidden="true">*</span></label><input {...inputProps('title')} maxLength={160} value={form.title} onChange={e => change('title', e.target.value)} placeholder="Ej. Redes I · Parcial" required />{hint('title')}</div>
      <div className="field"><label htmlFor="event-type">Tipo de evento <span aria-hidden="true">*</span></label><select {...inputProps('type')} value={form.type} onChange={e => change('type', e.target.value)}>{Object.entries(typeLabels).map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select>{hint('type')}</div>
      <div className="field"><label htmlFor="event-scope">Alcance <span aria-hidden="true">*</span></label><select {...inputProps('scope')} value={form.scope} onChange={e => change('scope', e.target.value)}><option value="section">Usuarios asociados a la sección</option><option value="course">Usuarios asociados al curso</option><option value="institution">Toda la institución</option></select>{hint('scope')}</div>
      <div className="field"><div className="field-label-row"><label htmlFor="event-courseId">Curso {form.scope !== 'institution' && <span aria-hidden="true">*</span>}</label><button type="button" className="text-link" disabled={form.scope === 'institution'} onClick={() => { createCatalog.reset(); setCatalog('course'); }}><Plus size={13} />Crear curso</button></div><select {...inputProps('courseId')} value={form.courseId} onChange={e => change('courseId', e.target.value)} disabled={form.scope === 'institution'}><option value="">{form.scope === 'institution' ? 'Todos los cursos' : 'Selecciona un curso'}</option>{courses.data?.map(row => <option value={row.id} key={row.id}>{row.name}</option>)}</select>{hint('courseId')}</div>
      <div className="field"><div className="field-label-row"><label htmlFor="event-sectionId">Sección {form.scope === 'section' && <span aria-hidden="true">*</span>}</label><button type="button" className="text-link" disabled={!form.courseId || form.scope !== 'section'} onClick={() => { createCatalog.reset(); setCatalog('section'); }}><Plus size={13} />Crear sección</button></div><select {...inputProps('sectionId')} value={form.sectionId} disabled={form.scope !== 'section' || !form.courseId} onChange={e => change('sectionId', e.target.value)}><option value="">{form.scope === 'section' ? 'Selecciona una sección' : 'Todas las secciones'}</option>{sections.data?.map(row => <option value={row.id} key={row.id}>{row.name}</option>)}</select>{hint('sectionId')}{sections.error && <AcademicError error={sections.error} retry={() => { void sections.refetch(); }} />}</div>
      <div className="field"><label htmlFor="event-startsAt">Fecha y hora de inicio <span aria-hidden="true">*</span></label><input {...inputProps('startsAt')} type="datetime-local" value={form.startsAt} onChange={e => change('startsAt', e.target.value)} required />{hint('startsAt')}</div><div className="field"><label htmlFor="event-endsAt">Fecha y hora de fin <span aria-hidden="true">*</span></label><input {...inputProps('endsAt')} type="datetime-local" value={form.endsAt} onChange={e => change('endsAt', e.target.value)} required />{hint('endsAt')}</div>
      <div className="field"><label htmlFor="event-source">Fuente</label><input id="event-source" value="Manual" readOnly /></div><div className="field"><label htmlFor="event-reason">Motivo {id ? 'del cambio' : 'del registro'} <span aria-hidden="true">*</span></label><textarea {...inputProps('reason')} value={form.reason} maxLength={500} onChange={e => change('reason', e.target.value)} placeholder="Explica por qué se registra o modifica el evento" required />{hint('reason')}</div>
    </fieldset>{save.error && <AcademicError error={save.error} />}{save.error instanceof ApiError && save.error.status === 409 && <button type="button" className="secondary-button" onClick={() => { void current.refetch(); save.reset(); }}>Cargar versión actual</button>}<div className="form-actions"><button className="primary-button" disabled={blocked || save.isPending}><Check size={19} />{save.isPending ? 'Guardando…' : 'Validar y guardar'}</button><Link className="secondary-button" to="/admin/calendario">Cancelar</Link></div></form>
    <aside className="academic-preview"><div className="page-card"><h2>Vista previa del evento</h2><h3><CalendarDays size={23} />{form.title.trim() || `${course?.name ?? 'Evento académico'} · ${typeLabels[form.type]}`}</h3><p><Users size={18} /><span>{form.scope === 'institution' ? 'Aplica a toda la institución' : form.scope === 'course' ? 'Aplica solo a usuarios asociados al curso' : 'Aplica solo a usuarios asociados a la sección'}</span></p><p><CalendarDays size={18} /><span>{previewStart ? `${dateLabel(previewStart)} · ${time(previewStart)}` : 'Selecciona la fecha de inicio'}{previewEnd && ` – ${time(previewEnd)}`}</span></p><p><BookOpen size={18} /><span>{course ? `Curso: ${course.name}` : form.scope === 'institution' ? 'Curso: todos' : 'Curso: por seleccionar'}{section && ` · Sección: ${section.code}`}</span></p><span className={`event-type-label event-${form.type}`}>{typeLabels[form.type]}</span></div><div className="academic-info"><Info size={23} /><div><strong>Fechas y alcance del evento</strong><p>Las horas se muestran en Lima. Los eventos por curso o sección solo se aplican a sus usuarios asociados.</p></div></div></aside></div>
    {catalog && <Dialog title={catalog === 'course' ? 'Crear curso' : 'Crear sección'} onClose={() => setCatalog(null)}><form onSubmit={e => { e.preventDefault(); createCatalog.mutate(); }}>{(['code', 'name', 'reason'] as const).map(key => <div className="field" key={key}><label htmlFor={`catalog-${key}`}>{key === 'code' ? 'Código' : key === 'name' ? 'Nombre' : 'Motivo del registro'}</label><input id={`catalog-${key}`} value={catalogForm[key]} required minLength={key === 'reason' ? 5 : 1} maxLength={key === 'reason' ? 500 : key === 'code' ? 40 : 160} onChange={e => setCatalogForm(previous => ({ ...previous, [key]: e.target.value }))} /></div>)}{createCatalog.error && <AcademicError error={createCatalog.error} />}<div className="form-actions"><button type="button" className="secondary-button" onClick={() => setCatalog(null)}>Cancelar</button><button className="primary-button" disabled={createCatalog.isPending}>Guardar {catalog === 'course' ? 'curso' : 'sección'}</button></div></form></Dialog>}
  </section>;
}
