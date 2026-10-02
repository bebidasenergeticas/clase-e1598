import { useEffect, useRef } from 'react'
import { sections } from '../data/courseContent'
import { useUI } from '../store/ui'
import { goNext, goPrev, goToSection, toggleFullscreen } from '../hooks/navigation'
import { IconClinic, IconFullscreen, IconHide, IconHome, IconIndex, IconMotion, IconNext, IconPrev, IconQuestion, IconSlides } from './Icons'

const shortcuts: [string, string][] = [
  ['← / →', 'Paso o sección anterior / siguiente'],
  ['Shift + ← / →', 'Saltar sección completa'],
  ['F', 'Pantalla completa'],
  ['P', 'Presentación oficial'],
  ['C', 'Workflow Clinic'],
  ['Q', 'Show me your workflow'],
  ['I', 'Índice'],
  ['M', 'Ocultar / mostrar menú'],
  ['Inicio', 'Volver al inicio'],
]

export function openPresentationForActive() {
  const s = useUI.getState()
  if (s.presentationOpen) {
    s.closePresentation()
    return
  }
  const meta = sections.find((m) => m.id === s.activeSection)
  // Si el profesor ya navegó el PDF, respetamos esa página; si no, la relacionada con la sección.
  s.openPresentation(meta?.slide && s.activeSection !== 'oficial' ? meta.slide : s.slide)
}

export function TeacherDock() {
  const dockVisible = useUI((s) => s.dockVisible)
  const indexOpen = useUI((s) => s.indexOpen)
  const motion = useUI((s) => s.motion)
  const active = useUI((s) => s.activeSection)
  const toggleDock = useUI((s) => s.toggleDock)
  const setIndexOpen = useUI((s) => s.setIndexOpen)
  const toggleMotion = useUI((s) => s.toggleMotion)
  const openFloor = useUI((s) => s.openFloor)
  const panelRef = useRef<HTMLDivElement>(null)
  const meta = sections.find((s) => s.id === active) ?? sections[0]

  useEffect(() => {
    if (!indexOpen) return
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIndexOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [indexOpen, setIndexOpen])

  if (openFloor) return null

  if (!dockVisible) {
    return <button className="dock-restore" onClick={toggleDock} aria-label="Mostrar menú del profesor (M)" title="Mostrar menú (M)" />
  }

  return (
    <div className="dock-wrap" ref={panelRef}>
      {indexOpen && (
        <div className="dock-index panel" role="dialog" aria-label="Índice de la clase">
          <div className="dock-index__head mono">Índice · E1598 / W09</div>
          <ol className="dock-index__list">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  className={`dock-index__item ${s.id === active ? 'is-active' : ''}`}
                  onClick={() => {
                    goToSection(s.id)
                    setIndexOpen(false)
                  }}
                >
                  <span className="mono">{s.code}</span>
                  <span>{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="dock-index__keys">
            {shortcuts.map(([k, v]) => (
              <div key={k}>
                <kbd>{k}</kbd>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <nav className="dock" aria-label="Controles del profesor">
        <button className="icon-btn" onClick={() => goPrev()} aria-label="Anterior (←)" title="Anterior (←)">
          <IconPrev />
        </button>
        <button className="dock__now" onClick={() => setIndexOpen(!indexOpen)} aria-label={`Sección ${meta.code}: ${meta.title}. Abrir índice`} aria-expanded={indexOpen}>
          <span className="mono dock__code">{meta.code}</span>
          <span className="dock__title">{meta.title}</span>
        </button>
        <button className="icon-btn" onClick={() => goNext()} aria-label="Siguiente (→)" title="Siguiente (→)">
          <IconNext />
        </button>
        <span className="dock__sep" aria-hidden />
        <button className="icon-btn" onClick={() => setIndexOpen(!indexOpen)} aria-label="Índice (I)" title="Índice (I)" aria-pressed={indexOpen}>
          <IconIndex />
        </button>
        <button className="icon-btn" onClick={openPresentationForActive} aria-label="Presentación oficial (P)" title="Presentación oficial (P)">
          <IconSlides />
        </button>
        <button className="icon-btn" onClick={() => goToSection('clinica')} aria-label="Workflow Clinic (C)" title="Workflow Clinic (C)">
          <IconClinic />
        </button>
        <button className="icon-btn" onClick={() => goToSection('showme')} aria-label="Show me your workflow (Q)" title="Show me your workflow (Q)">
          <IconQuestion />
        </button>
        <span className="dock__sep" aria-hidden />
        <button className="icon-btn" onClick={toggleMotion} aria-label="Animaciones" title={motion ? 'Pausar animaciones' : 'Activar animaciones'} aria-pressed={motion}>
          <IconMotion />
        </button>
        <button className="icon-btn" onClick={() => toggleFullscreen()} aria-label="Pantalla completa (F)" title="Pantalla completa (F)">
          <IconFullscreen />
        </button>
        <button className="icon-btn" onClick={() => goToSection('boot')} aria-label="Volver al inicio" title="Volver al inicio (Inicio)">
          <IconHome />
        </button>
        <button className="icon-btn" onClick={toggleDock} aria-label="Ocultar menú (M)" title="Ocultar menú (M)">
          <IconHide />
        </button>
      </nav>
    </div>
  )
}

export function Hud() {
  const active = useUI((s) => s.activeSection)
  const openFloor = useUI((s) => s.openFloor)
  const barRef = useRef<HTMLDivElement>(null)
  const meta = sections.find((s) => s.id === active) ?? sections[0]

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const k = max > 0 ? window.scrollY / max : 0
      if (barRef.current) barRef.current.style.transform = `scaleX(${k})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  if (openFloor) return null
  return (
    <header className="hud" aria-hidden>
      <div className="hud__bar">
        <div ref={barRef} />
      </div>
      <div className="hud__left mono">
        <span className="hud__mark" />
        Automation Systems <span className="hud__dim">· E1598 / W09</span>
      </div>
      <div className="hud__right mono">
        <span className="hud__dim">{meta.title}</span>
        <span>
          {meta.code}
          <span className="hud__dim">/{sections[sections.length - 1].code}</span>
        </span>
      </div>
    </header>
  )
}
