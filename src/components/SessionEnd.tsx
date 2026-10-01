import { useEffect, useRef } from 'react'
import { useUI } from '../store/ui'
import { useKeyCapture } from '../hooks/keyboard'
import { PdfPage } from '../pdf/PdfPage'
import { Badge } from './Badge'
import { cierre } from '../data/courseContent'
import { goToSection } from '../hooks/navigation'

/** Pantalla final: diapositiva oficial 12 ("Semana 9 completada"). */
export function SessionEnd() {
  const ended = useUI((s) => s.sessionEnded)
  const setEnded = useUI((s) => s.setSessionEnded)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ended) ref.current?.focus()
  }, [ended])
  useKeyCapture(ended, (e) => {
    if (e.key === 'Escape') {
      setEnded(false)
      return true
    }
    return e.key !== 'f' && e.key !== 'F'
  })
  if (!ended) return null
  return (
    <div ref={ref} className="session-end" role="dialog" aria-modal="true" aria-label="Sesión finalizada" tabIndex={-1}>
      <div className="session-end__top">
        <Badge kind="official" />
        <span className="mono muted">{cierre.final.join(' · ')}</span>
      </div>
      <div className="session-end__slide">
        <PdfPage page={12} />
      </div>
      <div className="session-end__foot">
        <span className="mono">Gracias, E1598.</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn--sm"
            onClick={() => {
              setEnded(false)
              goToSection('boot')
            }}
          >
            Volver al inicio
          </button>
          <button className="btn btn--sm" onClick={() => setEnded(false)}>
            Cerrar · Esc
          </button>
        </div>
      </div>
    </div>
  )
}
