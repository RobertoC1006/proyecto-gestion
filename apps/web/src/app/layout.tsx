import { Sidebar } from "../components/Sidebar";
import { AppHeader } from "../components/AppHeader";
import "./globals.css";
import { useLocation } from 'react-router-dom';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const academic = useLocation().pathname.startsWith('/admin/calendario');
  return <div className={`app-shell ${academic ? 'academic-shell' : ''}`}><Sidebar academic={academic} /><main className="main-content"><AppHeader title="Mis incidencias" academic={academic} />{children}</main></div>;
}
