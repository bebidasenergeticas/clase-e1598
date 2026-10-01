import { ScreenSection, SectionHead } from '../components/Section'
import { WorkflowClinic } from '../clinic/WorkflowClinic'

export function ClinicaSection() {
  return (
    <ScreenSection id="clinica" className="clinica">
      <div className="section-screen">
        <div className="clinica__head">
          <SectionHead id="clinica" kicker="Mini herramienta" badge={null} />
          <h2 className="clinica__title">WORKFLOW CLINIC</h2>
          <p className="muted">Escribe el caso de un alumno y míralo como arquitectura: input → process → decision → action → output. Se guarda solo en este navegador.</p>
        </div>
        <WorkflowClinic />
      </div>
    </ScreenSection>
  )
}
