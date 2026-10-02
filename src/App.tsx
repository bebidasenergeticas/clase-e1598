import { useEffect } from 'react'
import { Hud, TeacherDock } from './components/TeacherDock'
import { SessionEnd } from './components/SessionEnd'
import { PresentationOverlay } from './pdf/OfficialViewer'
import { useActiveSectionTracker, useGlobalKeys, useMotionAttr } from './hooks/useGlobalKeys'
import { refreshScrollTriggers } from './hooks/useScrollProgress'
import { loadOfficialPdf } from './pdf/pdfDocument'
import { BootSection } from './sections/BootSection'
import { OfficialSection } from './sections/OfficialSection'
import { LimitesSection } from './sections/LimitesSection'
import { Nivel2Section } from './sections/Nivel2Section'
import { RealWorldSection } from './sections/RealWorldSection'
import { IASection } from './sections/IASection'
import { HerramientasSection } from './sections/HerramientasSection'
import { CasosSection } from './sections/CasosSection'
import { LaunchpadSection } from './sections/LaunchpadSection'
import { ShowMeSection } from './sections/ShowMeSection'
import { ClinicaSection } from './sections/ClinicaSection'
import { ReglasSection } from './sections/ReglasSection'
import { CierreSection } from './sections/CierreSection'

export default function App() {
  useGlobalKeys()
  useActiveSectionTracker()
  useMotionAttr()

  useEffect(() => {
    // Precarga del PDF oficial en segundo plano y recálculo de scroll al cargar fuentes
    loadOfficialPdf().catch(() => {})
    document.fonts?.ready.then(() => refreshScrollTriggers())
  }, [])

  return (
    <>
      <a className="skip-link" href="#oficial">
        Saltar a la presentación oficial
      </a>
      <div className="app-backdrop" aria-hidden />
      <Hud />
      <main id="main">
        <BootSection />
        <OfficialSection />
        <LimitesSection />
        <Nivel2Section />
        <RealWorldSection />
        <IASection />
        <HerramientasSection />
        <CasosSection />
        <LaunchpadSection />
        <ShowMeSection />
        <ClinicaSection />
        <ReglasSection />
        <CierreSection />
      </main>
      <TeacherDock />
      <PresentationOverlay />
      <SessionEnd />
    </>
  )
}
