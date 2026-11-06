import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import RootLayout from "./app/layout";
import HomePage from "./app/page";
import LoginPage from "./app/login/page";
import IncidenciasPage from "./app/incidencias/page";
import NuevaIncidenciaPage from "./app/incidencias/nueva/page";
import IncidenciaDetailPage from "./app/incidencias/[id]/page";
import ConstanciasPage from "./app/constancias/page";
import VerifyCertificatePage from "./app/verificar/[codigo]/page";
import TiQueuePage from "./app/ti/cola/page";
import TiTicketDetailPage from "./app/ti/tickets/[id]/page";

function ViewRouter() {
  const path = window.location.pathname;

  if (path === "/login") return <LoginPage />;
  if (path === "/incidencias") return <IncidenciasPage />;
  if (path === "/incidencias/nueva") return <NuevaIncidenciaPage />;
  if (path.startsWith("/incidencias/")) return <IncidenciaDetailPage />;
  if (path === "/constancias") return <ConstanciasPage />;
  if (path.startsWith("/verificar/")) return <VerifyCertificatePage />;
  if (path === "/ti/cola") return <TiQueuePage />;
  if (path.startsWith("/ti/tickets/")) return <TiTicketDetailPage />;
  return <HomePage />;
}

function App() {
  return <RootLayout><ViewRouter /></RootLayout>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>,
);
