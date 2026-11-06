import { Sidebar } from "../components/Sidebar";
import { AppHeader } from "../components/AppHeader";
import "./globals.css";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="app-shell"><Sidebar /><main className="main-content"><AppHeader title="Mis incidencias" />{children}</main></div>;
}
