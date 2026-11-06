import { CalendarDays, LaptopMinimal, Plus } from 'lucide-react';

export function AcademicBanner({ form = false, editing = false }: { form?: boolean; editing?: boolean }) {
  return <div className="academic-banner"><div className="academic-illustration" aria-hidden="true"><LaptopMinimal size={70} strokeWidth={1.4} /><CalendarDays size={25} />{form && <span><Plus size={15} /></span>}</div><div><h1>{form ? editing ? 'Editar evento académico' : 'Crear evento académico' : 'Calendario académico'}</h1><p>{form ? editing ? 'Actualiza las fechas y el alcance del evento' : 'Registra un nuevo evento académico de forma manual' : 'Gestión de eventos académicos por curso y sección'}</p></div><span className="academic-timezone">Hora de Lima</span></div>;
}
