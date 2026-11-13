import { FileText, ShieldCheck } from '@phosphor-icons/react'
import { Button, Card, EmptyState, Notice, PageHeading } from '../../components/ui'

export default function ConstanciasPage() {
  return <section>
    <PageHeading
      title="Mis constancias"
      subtitle="Consulta las constancias asociadas a tus incidencias resueltas."
      illustrationIcon={FileText}
    />
    <Notice tone="amber" icon={ShieldCheck} role="status">
      La consulta y emisión de constancias estará disponible cuando el servicio de constancias esté conectado.
    </Notice>
    <div className="content-grid content-grid--two">
      <Card>
        <h2>Constancias disponibles</h2>
        <p className="body-muted">Aquí aparecerán las incidencias elegibles para solicitar una constancia.</p>
        <EmptyState
          title="Listado en preparación"
          description="Todavía no podemos consultar tus constancias. No se ha realizado ninguna consulta al backend."
        />
      </Card>
      <Card>
        <h2>Detalle de constancia</h2>
        <p className="body-muted">Todavía no existe un detalle real de constancia para revisar.</p>
        <Notice tone="amber" role="status">
          No existe un PDF descargable ni un código de verificación disponible hasta integrar el servicio de constancias.
        </Notice>
        <div className="button-row">
          <Button disabled>Descargar PDF</Button>
          <Button variant="secondary" disabled>Verificación pública</Button>
        </div>
      </Card>
    </div>
  </section>;
}
