import { lazy, useState } from 'react'
import { ia } from '../data/courseContent'
import { BeatDots, SectionHead, StorySection } from '../components/Section'
import { FallbackFlow, SceneSlot } from '../components/SceneSlot'
import { RevealText } from '../components/RevealText'
import type { Shot } from '../scenes/AIScene'

const AIScene = lazy(() => import('../scenes/AIScene'))

function Quiz({ onShot }: { onShot: (s: Shot) => void }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  return (
    <ul className="ai-quiz" aria-label="Clasifica cada tarea: regla o IA">
      {ia.quiz.map((q, i) => {
        const on = revealed[i]
        return (
          <li key={q.task}>
            <button
              className={`ai-quiz__item ${on ? `is-${q.answer}` : ''}`}
              onClick={() => {
                setRevealed((r) => ({ ...r, [i]: !r[i] }))
                if (!on) onShot({ id: Date.now(), side: q.answer })
              }}
              aria-pressed={!!on}
            >
              <span>{q.task}</span>
              <span className="mono ai-quiz__a">{on ? (q.answer === 'rule' ? 'REGLA' : 'IA') : '¿?'}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function IASection() {
  const [shot, setShot] = useState<Shot | null>(null)
  return (
    <StorySection id="ia" className="ia">
      {({ progress, beat }) => {
        const info = ia.beats[beat]
        const isStatement = beat === 2
        return (
          <>
            <SceneSlot
              className="stage__canvas"
              label="Bifurcación 3D: a la izquierda reglas deterministas en una rejilla precisa; a la derecha un núcleo interpretativo para la IA"
              fallback={<FallbackFlow labels={['INPUT', '¿REGLA O IA?', 'DETERMINISTIC', 'INTERPRETATIVE']} accent="#a996ff" />}
            >
              {({ visible }) => <AIScene visible={visible} progress={progress} beats={4} shot={shot} />}
            </SceneSlot>
            <div className={`stage__dim ${isStatement ? 'is-on' : ''}`} aria-hidden />

            <div className={`stage__overlay ia__layout ${isStatement ? 'is-faded' : ''}`}>
              <div className="ia__head">
                <SectionHead id="ia" kicker="IA: ¿sí o no?" />
                <h2 className="ia__title" key={beat}>
                  <RevealText text={info.title || ' '} on />
                </h2>
              </div>

              {beat === 3 ? (
                <div className="ia__quiz">
                  <span className="mono muted">Toca una tarea para revelar la respuesta · Pregunta al grupo primero</span>
                  <Quiz onShot={setShot} />
                </div>
              ) : (
                <div className={`ia__cols ${beat >= 1 ? 'is-on' : ''}`}>
                  <div className="ia__col ia__col--rule">
                    <span className="mono">Reglas · determinístico</span>
                    <ul>
                      {ia.deterministic.map((x, i) => (
                        <li key={x} style={{ transitionDelay: `${beat >= 1 ? i * 0.06 : 0}s` }}>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="ia__col ia__col--ai">
                    <span className="mono">IA · interpretativo</span>
                    <ul>
                      {ia.interpretative.map((x, i) => (
                        <li key={x} style={{ transitionDelay: `${beat >= 1 ? 0.2 + i * 0.06 : 0}s` }}>
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className={`stage__question ia__statement ${isStatement ? 'is-on' : ''}`} aria-hidden={!isStatement}>
              <p className="big-question">
                <RevealText text={ia.statement} on={isStatement} stagger={0.06} />
              </p>
              <div className={`ia__rule fade ${isStatement ? 'is-on' : ''}`} style={{ transitionDelay: '0.8s' }}>
                <span className="ia__rule-ai">{ia.ruleEs[0]}</span>
                <span className="ia__rule-rule">{ia.ruleEs[1]}</span>
              </div>
              <span className={`mono muted fade ${isStatement ? 'is-on' : ''}`} style={{ transitionDelay: '1.2s' }}>
                {ia.ruleEn}
              </span>
            </div>
            <BeatDots count={4} beat={beat} />
          </>
        )
      }}
    </StorySection>
  )
}
