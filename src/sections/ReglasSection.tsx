import { lazy } from 'react'
import { rules, see } from '../data/courseContent'
import { SceneCaption } from '../components/SceneCaption'
import { BeatDots, SectionHead, StorySection } from '../components/Section'
import { FallbackFlow, SceneSlot } from '../components/SceneSlot'
import { RevealText } from '../components/RevealText'
import { useUI } from '../store/ui'

const RobotScene = lazy(() => import('../scenes/RobotScene'))

export function ReglasSection() {
  const openPresentation = useUI((s) => s.openPresentation)
  return (
    <StorySection id="reglas" className="rules">
      {({ progress, beat }) => (
        <>
          <SceneSlot className="stage__canvas" label="Brazo robótico 3D que se ensambla pieza por pieza: una pieza por regla" fallback={<FallbackFlow labels={['01', '02', '03', '04', '05']} accent="#f5a524" />}>
            {({ visible }) => <RobotScene visible={visible} progress={progress} beats={6} />}
          </SceneSlot>
          <div className="stage__overlay rules__layout">
            <div className="rules__head">
              <SectionHead id="reglas" kicker="Las 5 reglas" />
              <span className="mono muted rules__count">
                {Math.min(beat + 1, 5)} / 5 · {beat >= 5 ? 'SISTEMA COMPLETO' : 'ENSAMBLANDO'}
              </span>
              <SceneCaption text={beat >= 5 ? see.rules.done : see.rules.building} />
            </div>
            <ol className="rules__list">
              {rules.map((r, i) => {
                const state = beat >= 5 ? 'is-done' : beat > i ? 'is-past' : beat === i ? 'is-now' : ''
                const visible = beat >= i
                return (
                  <li key={r.n} className={`rule ${state} ${visible ? 'is-visible' : ''}`}>
                    <span className="rule__n mono">{r.n}</span>
                    <p className="rule__t">
                      {r.lines.map((l, j) => (
                        <span key={j} className="rule__line">
                          <RevealText text={l} on={visible} delay={j * 0.25} stagger={0.04} />
                        </span>
                      ))}
                    </p>
                  </li>
                )
              })}
            </ol>
            <button className="btn btn--sm rules__official" onClick={() => openPresentation(10)}>
              Ver conclusiones oficiales · diap. 10
            </button>
          </div>
          <BeatDots count={6} beat={beat} />
        </>
      )}
    </StorySection>
  )
}
