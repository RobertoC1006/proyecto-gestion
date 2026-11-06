import { ArrowRight, CheckCircle2, Clock3, Plus } from "lucide-react";
import { tickets } from "../data/mock";
import { PriorityBadge } from "../components/PriorityBadge";

export default function HomePage() {
  const resolved = tickets.filter((ticket) => ticket.status === "Resuelto").length;
  return <section>
    <div className="page-intro"><div><h2>Hola, Johan 👋</h2><p>Aquí tienes un resumen de tus solicitudes recientes.</p></div><a className="primary-button" href="/incidencias/nueva"><Plus size={17} />Nueva incidencia</a></div>
    <div className="stats-grid">
      <div className="stat-card"><span className="stat-icon blue"><Clock3 size={19} /></span><div><strong>{tickets.length}</strong><small>Incidencias registradas</small></div></div>
      <div className="stat-card"><span className="stat-icon green"><CheckCircle2 size={19} /></span><div><strong>{resolved}</strong><small>Incidencias resueltas</small></div></div>
    </div>
    <div className="page-card"><div className="page-intro"><div><h2>Actividad reciente</h2><p>Consulta el estado de tus últimos reportes.</p></div><a className="text-link" href="/incidencias">Ver todas <ArrowRight size={14} /></a></div><div className="ticket-grid">{tickets.slice(0, 3).map((ticket) => <a className="ticket-row" href={`/incidencias/${ticket.id}`} key={ticket.id}><span className="ticket-id">{ticket.id}</span><div><div className="ticket-title">{ticket.title}</div><span className="ticket-meta">{ticket.createdAt} · {ticket.category}</span></div><PriorityBadge priority={ticket.priority} /><span className={`status status-${ticket.status === "Resuelto" ? "resuelto" : ticket.status === "En atención" ? "atencion" : "espera"}`}>{ticket.status}</span><ArrowRight size={17} className="row-arrow" /></a>)}</div></div>
  </section>;
}
