import { Bell, ChevronDown, GraduationCap, Search, UserRound } from "lucide-react";

export function AppHeader({ eyebrow, title, academic = false }: { eyebrow?: string; title: string; academic?: boolean }) {
  if (academic) return <header className="topbar academic-topbar"><label className="search-box"><Search size={18} /><input disabled aria-label="Búsqueda general no disponible" placeholder="Buscar en el sistema..." /></label><div className="topbar-actions"><span className="academic-role"><GraduationCap size={19} />Administración</span><button className="icon-button" disabled aria-label="Notificaciones no disponibles"><Bell size={21} /></button><span className="academic-session"><UserRound size={17} />Sin sesión</span></div></header>;
  return (
    <header className="topbar">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        <label className="search-box">
          <Search size={17} />
          <input aria-label="Buscar" placeholder="Buscar..." />
        </label>
        <button className="icon-button notification" aria-label="Notificaciones"><Bell size={19} /><span /></button>
        <div className="header-user"><div className="avatar avatar-small">JR</div><span>Johan Rodríguez</span><ChevronDown size={16} /></div>
      </div>
    </header>
  );
}
