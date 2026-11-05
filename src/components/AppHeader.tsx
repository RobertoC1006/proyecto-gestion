import { Bell, ChevronDown, Search } from "lucide-react";

export function AppHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
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
