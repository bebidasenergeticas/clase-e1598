import { lazy, useEffect, useState } from 'react'
import { boot } from '../data/courseContent'
import { StorySection } from '../components/Section'
import { FallbackFlow, SceneSlot } from '../components/SceneSlot'
import { ScrambleText } from '../components/RevealText'
import { Badge } from '../components/Badge'
import { useUI } from '../store/ui'

const NetworkScene = lazy(() => import('../scenes/NetworkScene'))

function Typewriter({ text, start, speed = 55 }: { text: string; start: boolean; speed?: number }) {
  const motion = useUI((s) => s.motion)
  const [n, setN] = useState(motion ? 0 : text.length)
  useEffect(() => {
    if (!start) return
    if (!motion) {
      setN(text.length)
      return
    }
    setN(0)
    let i = 0
    const id = window.setInterval(() => {
      i++
      setN(i)
      if (i >= text.length) window.clearInterval(id)
    }, speed)
    return () => window.clearInterval(id)
  }, [start, motion, text, speed])
  return (
    <span aria-label={text}>
      <span aria-hidden>{text.slice(0, n)}</span>
      <span className="caret" aria-hidden />
    </span>
  )
}

/** Fases de arranque (ms). Con animaciones desactivadas se muestra todo. */
const PHASES = [0, 1500, 3500, 5300, 6800]

function useBootPhase() {
  const motion = useUI((s) => s.motion)
  const [phase, setPhase] = useState(motion ? 0 : PHASES.length)
  useEffect(() => {
    if (!motion) {
      setPhase(PHASES.length)
      return
    }
    const ids = PHASES.map((ms, i) => window.setTimeout(() => setPhase((p) => Math.max(p, i + 1)), ms))
    return () => ids.forEach(window.clearTimeout)
    // solo al montar: la secuencia corre una vez
  }, [])
  return phase
}

export function BootSection() {
  const phase = useBootPhase()
  return (
    <StorySection id="boot" className="boot">
      {({ progress, beat }) => (
        <>
          <SceneSlot className="stage__canvas" label="Red de nodos que se enciende y forma una arquitectura de automatización" fallback={<FallbackFlow labels={['TRIGGER', 'DATOS', 'REGLA', 'ACCIÓN', 'OUTPUT']} />}>
            {({ visible }) => <NetworkScene visible={visible} variant="boot" progress={progress} beats={2} />}
          </SceneSlot>
          <div className="boot__veil" data-beat={beat} aria-hidden />

          <div className={`stage__overlay boot__intro ${beat === 0 ? 'is-on' : 'is-off'}`} aria-hidden={beat !== 0}>
            <div className="boot__center">
              <h1 className="boot__title">
                <Typewriter text={boot.title} start={phase >= 1} />
              </h1>
              <div className={`boot__code fade ${phase >= 2 ? 'is-on' : ''}`}>
                <ScrambleText className="mono boot__code-a" text={boot.code} on={phase >= 2} />
                <span className="boot__code-sep" />
                <ScrambleText className="mono boot__code-b" text={boot.session} on={phase >= 2} duration={900} />
              </div>
              <div className="boot__lines">
                <p className={`boot__line fade ${phase >= 3 ? 'is-on' : ''}`}>{boot.lines[0]}</p>
                <p className={`boot__line boot__line--strong fade ${phase >= 4 ? 'is-on' : ''}`}>{boot.lines[1]}</p>
              </div>
            </div>
            <div className={`boot__foot fade ${phase >= 5 ? 'is-on' : ''}`}>
              <div className="boot__sub">
                <span className="mono boot__tag">{boot.tagline}</span>
                <span>{boot.subtitle}</span>
              </div>
              <span className="mono boot__hint">
                <kbd>→</kbd> o scroll para comenzar
              </span>
            </div>
          </div>

          <div className={`stage__overlay boot__recap ${beat === 1 ? 'is-on' : 'is-off'}`} aria-hidden={beat !== 1}>
            <div className="boot__recap-text">
              <div className="section-head">
                <span className="section-code">00</span>
                <span className="kicker">Filosofía de la sesión</span>
                <Badge kind="teacher" />
              </div>
              <p className="boot__phil-a">{boot.philosophy.a}</p>
              <p className="boot__phil-b">{boot.philosophy.b}</p>
            </div>
            <div className="boot__chips">
              <span className="mono boot__chips-label">Recap · lo que ya dominas</span>
              <ul>
                {boot.recap.map((r, i) => (
                  <li key={r} style={{ transitionDelay: `${beat === 1 ? 0.15 + i * 0.05 : 0}s` }}>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </StorySection>
  )
}
