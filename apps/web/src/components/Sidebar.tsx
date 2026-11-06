import { Activity, BarChart3, BookOpen, CalendarDays, ClipboardList, FileCheck2, Home, KeyRound, LifeBuoy, LockKeyhole, Settings, ShieldCheck, Ticket, Users } from "lucide-react";
import { Link, useLocation } from 'react-router-dom';

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

const academicLinks = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/incidencias', label: 'Tickets', icon: ClipboardList },
  { href: '/admin/calendario', label: 'Calendario Académico', icon: CalendarDays },
  { label: 'Reportes', icon: BarChart3 }, { label: 'Modelos', icon: Activity },
  { href: '/ti/cola', label: 'Operaciones de TI', icon: ShieldCheck },
];
const administrationLinks = [ { label: 'Usuarios', icon: Users }, { label: 'Permisos', icon: KeyRound },
  { label: 'Configuración', icon: Settings }, { label: 'Privacidad', icon: LockKeyhole }, { label: 'Auditoría', icon: ClipboardList } ];

export function Sidebar({ academic = false }: { academic?: boolean }) {
  const path = useLocation().pathname;
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark"><span /></span>
        <span>Campus<span className="brand-accent">ITSM</span><small className="brand-institution">Universidad Privada Tallán</small></span>
      </div>
      <div className="profile-mini">
        <div className="avatar">JR</div>
        <div><strong>Johan Rodríguez</strong><small>Estudiante</small></div>
      </div>
      <nav className="side-nav" aria-label="Navegación principal">
        {academic ? <>{academicLinks.map(({ href, label, icon: Icon }) => href ? <Link key={label} className="nav-link" to={href} aria-current={path.startsWith(href) && href !== '/' ? 'page' : undefined}><Icon size={19} /><span>{label}</span></Link> : <span className="nav-link unavailable" key={label} aria-disabled="true" title="Esta sección todavía no está disponible"><Icon size={19} /><span>{label}</span></span>)}<div className="nav-divider" />{administrationLinks.map(({ label, icon: Icon }) => <span className="nav-link unavailable" aria-disabled="true" title="Esta sección todavía no está disponible" key={label}><Icon size={19} /><span>{label}</span></span>)}</> : <><p className="nav-caption">MENÚ PRINCIPAL</p>
        {primaryLinks.map(({ href, label, icon: Icon }) => (
          <a className="nav-link" href={href} key={href}><Icon size={18} /><span>{label}</span></a>
        ))}
        <p className="nav-caption">OPERACIÓN TI</p>
        {tiLinks.map(({ href, label, icon: Icon }) => (
          <a className="nav-link" href={href} key={href}><Icon size={18} /><span>{label}</span></a>
        ))}
        <p className="nav-caption">ADMINISTRACIÓN</p>
        <a className="nav-link" href="/admin"><Users size={18} /><span>Administración</span></a>
        <Link className="nav-link" to="/admin/calendario"><CalendarDays size={18} /><span>Calendario</span></Link></>}
      </nav>
      {!academic && <div className="sidebar-bottom">
        <a className="nav-link" href="/admin"><Settings size={18} /><span>Configuración</span></a>
        <div className="support-card"><BookOpen size={19} /><div><strong>¿Necesitas ayuda?</strong><small>Consulta el centro de soporte</small></div></div>
      </div>}
    </aside>
  );
}
