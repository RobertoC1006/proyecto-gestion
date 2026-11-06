import { ArrowRight, ArrowUpDown, Clock3, Filter, Users } from "lucide-react";
import { tickets } from "../../../data/mock";
import { PriorityBadge } from "../../../components/PriorityBadge";

export default function TiQueuePage() {
  const contextualOrder = [tickets[0], tickets[1], tickets[2], tickets[3]];
  return <section>
    <div className="page-intro"><div><span className="eyebrow">OPERACIÓN TI</span><h2>Cola de atención</h2><p>Gestiona las incidencias priorizadas para el equipo de soporte.</p></div><button className="secondary-button"><Filter size={15} />Filtros</button></div>
    <div className="queue-summary"><div><span className="stat-icon blue"><Clock3 size={18} /></span><div><strong>4</strong><small>Tickets abiertos</small></div></div><div><span className="stat-icon orange"><ArrowUpDown size={18} /></span><div><strong>2</strong><small>Prioridad crítica</small></div></div><div><span className="stat-icon purple"><Users size={18} /></span><div><strong>3</strong><small>Agentes activos</small></div></div></div>
    <div className="page-card"><div className="queue-toolbar"><div><h3>Tickets pendientes</h3><p>Martes de la semana 8 · 10:00 a. m.</p></div><div className="queue-switch"><button type="button">Por llegada</button><button className="active" type="button">Contextual</button></div></div><div className="queue-table"><div className="queue-table-head"><span>ORDEN</span><span>TICKET</span><span>DESCRIPCIÓN</span><span>PRIORIDAD</span><span>ESTADO</span><span /></div>{contextualOrder.map((ticket, index) => <a className={`queue-table-row ${index === 0 ? "highlight-row" : ""}`} href={`/ti/tickets/${ticket.id}`} key={ticket.id}><strong className="queue-position">{index + 1}</strong><span className="ticket-id">{ticket.id}</span><span><strong>{ticket.title}</strong><small>{ticket.category} · {ticket.createdAt}</small></span><PriorityBadge priority={ticket.priority} /><span className={`status status-${ticket.status === "Resuelto" ? "resuelto" : ticket.status === "En atención" ? "atencion" : "espera"}`}>{ticket.status}</span><ArrowRight size={16} className="row-arrow" /></a>)}</div><div className="context-callout"><ArrowUpDown size={17} /><span><strong>Orden contextual activo:</strong> T1 sube del segundo al primer lugar por el examen que comienza en 30 minutos.</span></div></div>
  </section>;
}
