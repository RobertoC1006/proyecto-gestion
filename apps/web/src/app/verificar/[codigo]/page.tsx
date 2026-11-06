import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";

export default function VerifyCertificatePage() {
  return <section className="public-page">
    <div className="public-brand"><span className="brand-mark"><span /></span><strong>Campus<span className="brand-accent">Care</span></strong></div>
    <div className="verification-card">
      <div className="valid-icon"><CheckCircle2 size={34} /></div><span className="verified-label">DOCUMENTO VERIFICADO</span><h2>Constancia válida</h2><p className="verification-copy">La constancia consultada existe y fue emitida por CampusCare.</p>
      <div className="verification-data"><div><small>CÓDIGO DE CONSTANCIA</small><strong>CC-T1-2024</strong></div><div><small>PERSONA</small><strong>J*** R*******</strong></div><div><small>SERVICIO</small><strong>Aula virtual – Acceso</strong></div><div><small>FECHA DE ATENCIÓN</small><strong>Martes, semana 8</strong></div></div>
      <div className="verification-note"><CheckCircle2 size={16} />La información personal se muestra enmascarada para proteger la privacidad.</div>
      <a className="back-link" href="/constancias"><ArrowLeft size={15} />Volver a CampusCare</a>
    </div>
    <p className="public-footer">Verificación pública · <ExternalLink size={12} /> campuscare.edu</p>
  </section>;
}
