import { CheckCircle2, Download, ExternalLink, FileCheck2, QrCode } from "lucide-react";
import { tickets } from "../../data/mock";
import { PriorityBadge } from "../../components/PriorityBadge";

export default function ConstanciasPage() {
  const ticket = tickets[0];
  return <section>
    <div className="page-intro"><div><h2>Mis constancias</h2><p>Descarga los comprobantes de tus incidencias resueltas.</p></div></div>
    <div className="certificate-layout">
      <div className="page-card">
        <div className="certificate-list-head"><div><h3>Constancia disponible</h3><p>Generada para la incidencia resuelta.</p></div><span className="verified-label"><CheckCircle2 size={15} />Verificada</span></div>
        <div className="certificate-row"><span className="certificate-icon"><FileCheck2 size={23} /></span><div><strong>Constancia de atención · {ticket.id}</strong><small>Emitida el martes, 10:18 a. m. · PDF</small></div><button className="icon-text-button" type="button"><Download size={16} />Descargar</button></div>
        <a className="certificate-link" href="/verificar/CC-T1-2024"><ExternalLink size={14} />Abrir verificación pública</a>
      </div>
      <div className="certificate-preview">
        <div className="preview-toolbar"><span>VISTA PREVIA</span><span>1 de 1</span></div>
        <div className="document">
          <div className="document-brand"><span className="document-mark">C</span><strong>CampusCare</strong><span>CONSTANCIA DE ATENCIÓN</span></div>
          <div className="document-rule" />
          <span className="document-kicker">CONSTANCIA No. CC-T1-2024</span>
          <h3>Atención de incidencia</h3>
          <p>Se hace constar que <strong>Johan Rodríguez</strong> recibió atención por la incidencia registrada en CampusCare.</p>
          <div className="document-details"><div><small>INCIDENCIA</small><strong>{ticket.id} · {ticket.title}</strong></div><div><small>SERVICIO AFECTADO</small><strong>{ticket.category}</strong></div><div><small>FECHA Y DURACIÓN</small><strong>Martes 8 · 16 minutos</strong></div></div>
          <div className="document-footer"><div><small>HASH SHA-256</small><code>8f3a9c2e...7b12d04a</code><span>Firma institucional · CampusCare</span></div><div className="qr-drawing" aria-label="Código QR ilustrativo">{Array.from({ length: 25 }).map((_, index) => <i key={index} className={index % 3 === 0 || index % 7 === 0 ? "filled" : ""} />)}</div></div>
        </div>
      </div>
    </div>
  </section>;
}
