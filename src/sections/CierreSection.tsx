import { lazy } from 'react'
import { cierre } from '../data/courseContent'
import { BeatDots, StorySection } from '../components/Section'
import { FallbackFlow, SceneSlot } from '../components/SceneSlot'
import { RevealText, ScrambleText } from '../components/RevealText'
import { useUI } from '../store/ui'

const NetworkScene = lazy(() => import('../scenes/NetworkScene'))

export function CierreSection() {
  const setSessionEnded = useUI((s) => s.setSessionEnded)
  return (
    <StorySection id="cierre" className="closing">
      {({ progress, beat }) => (
        <>
          <SceneSlot className="stage__canvas" label="La arquitectura completa del módulo; al final aparecen nodos de decisión como adelanto del siguiente paso" fallback={<FallbackFlow labels={['MAPEAR', 'DISEÑAR', 'CONECTAR', 'PROBAR', 'DECIDIR']} accent="#f5a524" />}>
            {({ visible }) => <NetworkScene visible={visible} variant="closing" progress={progress} beats={5} />}
          </SceneSlot>
          <div className="closing__veil" data-beat={beat} aria-hidden />

          <div className="stage__overlay closing__layout">
            <div className={`closing__block ${beat === 0 ? 'is-on' : ''}`} aria-hidden={beat !== 0}>
              <span className="kicker kicker--gold">12 · Fin de capítulo</span>
              <h2 className="closing__complete">
                <span className="closing__l1">{cierre.complete[0]}</span>
                <span className="closing__l2">{beat === 0 ? <ScrambleText text={cierre.complete[1]} duration={1100} /> : cierre.complete[1]}</span>
              </h2>
            </div>

            <div className={`closing__block ${beat === 1 ? 'is-on' : ''}`} aria-hidden={beat !== 1}>
              <ul className="closing__verbs">
                {cierre.verbs.map((v, i) => (
                  <li key={v} style={{ transitionDelay: `${beat === 1 ? 0.2 + i * 0.6 : 0}s` }}>
                    {v}
                  </li>
                ))}
              </ul>
            </div>

            <div className={`closing__block ${beat === 2 ? 'is-on' : ''}`} aria-hidden={beat !== 2}>
              <span className="mono muted">{cierre.now}</span>
              <p className="big-question">
                <RevealText text={cierre.line1} on={beat === 2} stagger={0.06} />
              </p>
            </div>

            <div className={`closing__block ${beat === 3 ? 'is-on' : ''}`} aria-hidden={beat !== 3}>
              <p className="big-question big-question--md closing__next">
                <RevealText text={cierre.line2} on={beat === 3} stagger={0.05} delay={0.4} />
              </p>
              <span className="mono closing__teaser">Próximo módulo · teaser</span>
            </div>

            <div className={`closing__block closing__final ${beat === 4 ? 'is-on' : ''}`} aria-hidden={beat !== 4}>
              <span className="mono closing__e">{cierre.final[0]}</span>
              <h2 className="closing__as">{cierre.final[1]}</h2>
              <span className="mono closing__wk">{cierre.final[2]}</span>
              <button className="btn btn--primary closing__btn" onClick={() => setSessionEnded(true)} tabIndex={beat === 4 ? 0 : -1}>
                {cierre.button}
              </button>
            </div>
          </div>
          <BeatDots count={5} beat={beat} />
        </>
      )}
    </StorySection>
  )
}
