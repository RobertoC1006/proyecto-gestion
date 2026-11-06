import { GraduationCap, Headphones, ShieldCheck, UserRound } from "lucide-react";

const roles = [
  { label: "Estudiante", detail: "Reporta y consulta tus incidencias", icon: GraduationCap, href: "/" },
  { label: "Docente", detail: "Gestiona solicitudes de tus cursos", icon: UserRound, href: "/incidencias" },
  { label: "Agente TI", detail: "Atiende la cola de soporte", icon: Headphones, href: "/ti/cola" },
  { label: "Administrador", detail: "Configura y supervisa el sistema", icon: ShieldCheck, href: "/admin" },
];

export default function LoginPage() {
  return <section className="login-page"><div className="login-card"><span className="eyebrow">CAMPUSCARE</span><h2>¿Cómo deseas ingresar?</h2><p>Selecciona tu rol para acceder a las herramientas de gestión de incidencias académicas.</p><div className="role-grid">{roles.map(({ label, detail, icon: Icon, href }) => <a className="role-button" href={href} key={label}><Icon size={20} color="#1d4ed8" /><strong>{label}</strong><small>{detail}</small></a>)}</div><label className="policy"><input type="checkbox" />Acepto la política de tratamiento de datos personales y el uso de esta demostración.</label><p className="login-note">Esta es una vista demostrativa con información simulada.</p></div></section>;
}
