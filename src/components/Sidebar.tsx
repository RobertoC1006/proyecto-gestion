import { BarChart3, BookOpen, CalendarDays, FileCheck2, Home, LifeBuoy, Settings, ShieldCheck, Ticket, Users } from "lucide-react";

const primaryLinks = [
  { href: "/", label: "Resumen", icon: Home },
  { href: "/incidencias", label: "Mis incidencias", icon: Ticket },
  { href: "/incidencias/nueva", label: "Reportar incidencia", icon: LifeBuoy },
  { href: "/constancias", label: "Constancias", icon: FileCheck2 },
];

const tiLinks = [
  { href: "/ti/cola", label: "Cola de atención", icon: ShieldCheck },
  { href: "/ti/dashboard", label: "Dashboard TI", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><span /></span>
        <span>Campus<span className="brand-accent">Care</span></span>
      </div>
      <div className="profile-mini">
        <div className="avatar">JR</div>
        <div><strong>Johan Rodríguez</strong><small>Estudiante</small></div>
      </div>
      <nav className="side-nav" aria-label="Navegación principal">
        <p className="nav-caption">MENÚ PRINCIPAL</p>
        {primaryLinks.map(({ href, label, icon: Icon }) => (
          <a className="nav-link" href={href} key={href}><Icon size={18} /><span>{label}</span></a>
        ))}
        <p className="nav-caption">OPERACIÓN TI</p>
        {tiLinks.map(({ href, label, icon: Icon }) => (
          <a className="nav-link" href={href} key={href}><Icon size={18} /><span>{label}</span></a>
        ))}
        <p className="nav-caption">ADMINISTRACIÓN</p>
        <a className="nav-link" href="/admin"><Users size={18} /><span>Administración</span></a>
        <a className="nav-link" href="/admin"><CalendarDays size={18} /><span>Calendario</span></a>
      </nav>
      <div className="sidebar-bottom">
        <a className="nav-link" href="/admin"><Settings size={18} /><span>Configuración</span></a>
        <div className="support-card"><BookOpen size={19} /><div><strong>¿Necesitas ayuda?</strong><small>Consulta el centro de soporte</small></div></div>
      </div>
    </aside>
  );
}
