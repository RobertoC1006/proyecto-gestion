import { ArrowRight, Funnel as Filter, Plus } from '@phosphor-icons/react';
import { tickets } from "../../data/mock";
import { PriorityBadge } from "../../components/PriorityBadge";

export default function IncidenciasPage() {
  return <section><div className="page-intro"><div><h2>Mis incidencias</h2><p>Revisa el estado y seguimiento de tus solicitudes.</p></div><a className="primary-button" href="/incidencias/nueva"><Plus size={17} />Nueva incidencia</a></div><div className="page-card"><div className="toolbar"><div className="filter-tabs"><button className="active">Todas <span>4</span></button><button>Activas <span>3</span></button><button>Resueltas <span>1</span></button></div><button className="secondary-button"><Filter size={15} />Filtrar</button></div><div className="ticket-grid">{tickets.map((ticket) => <a className="ticket-row" href={`/incidencias/${ticket.id}`} key={ticket.id}><span className="ticket-id">{ticket.id}</span><div><div className="ticket-title">{ticket.title}</div><span className="ticket-meta">{ticket.createdAt} · {ticket.category}</span></div><PriorityBadge priority={ticket.priority} /><span className={`status status-${ticket.status === "Resuelto" ? "resuelto" : ticket.status === "En atención" ? "atencion" : "espera"}`}>{ticket.status}</span><ArrowRight size={17} className="row-arrow" /></a>)}</div></div></section>;
}
