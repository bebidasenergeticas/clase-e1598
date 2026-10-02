import { lazy, useCallback, useEffect, useRef, useState } from 'react'
import { limites, see, type LegendKey } from '../data/courseContent'
import { BeatDots, SectionHead, StorySection } from '../components/Section'
import { FallbackFlow, SceneSlot } from '../components/SceneSlot'
import { RevealText } from '../components/RevealText'
import { SlidePane } from '../pdf/OfficialViewer'
import { SceneCaption } from '../components/SceneCaption'
import type { FactoryEvent } from '../scenes/FactoryScene'

const FactoryScene = lazy(() => import('../scenes/FactoryScene'))

const legendFor: LegendKey[][] = [['data', 'ok'], ['data', 'problem'], ['data', 'problem', 'human'], ['data', 'human', 'log'], ['ok', 'human', 'log'], []]

/** Contador vivo + chip que parpadea: une lo que pasa en 3D con la lista de problemas. */
function useFactoryEvents() {
  const counts = useRef({ ok: 0, lost: 0, routed: 0 })
  const [tally, setTally] = useState(counts.current)
  const [flash, setFlash] = useState<number | null>(null)
  const flashTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    const id = window.setInterval(() => setTally({ ...counts.current }), 400)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(flashTimer.current)
    }
  }, [])
  const onEvent = useCallback((e: FactoryEvent) => {
    counts.current[e.kind]++
    if (e.problem !== undefined) {
      setFlash(e.problem)
      window.clearTimeout(flashTimer.current)
      flashTimer.current = window.setTimeout(() => setFlash(null), 1400)
    }
  }, [])
  return { tally, flash, onEvent }
}

const stageForBeat = [0, 0, 1, 2, 3, 3]

export function LimitesSection() {
  const ev = useFactoryEvents()
  return (
    <StorySection id="limites" className="limits">
      {({ progress, beat }) => {
        const info = limites.beats[Math.min(beat, limites.beats.length - 1)]
        const isQuestion = beat === 5
        const chipState = beat >= 4 ? 'ok' : beat >= 2 ? 'routed' : beat >= 1 ? 'alert' : 'off'
        return (
          <>
            <SceneSlot
              className="stage__canvas"
              label="Fábrica 3D: input, proceso y output; aparecen problemas y el flujo lineal se ramifica"
              fallback={<FallbackFlow labels={['INPUT', 'PROCESS', 'OUTPUT']} />}
            >
              {({ visible }) => <FactoryScene visible={visible} progress={progress} beats={6} onEvent={ev.onEvent} />}
            </SceneSlot>
            <div className={`stage__dim ${isQuestion ? 'is-on' : ''}`} aria-hidden />

            <div className={`stage__overlay story-grid ${isQuestion ? 'is-faded' : ''}`}>
              <div className="story-col">
                <SectionHead id="limites" kicker="Cuando lo básico se queda corto" />
                <SlidePane page={2} className="story-slide" />
                <div className="story-beat" key={beat}>
                  <span className="mono story-beat__kicker">{info.kicker}</span>
                  <h2 className="story-beat__title">
                    <RevealText text={info.title} on />
                  </h2>
                  <p className="story-beat__text fade is-on">{info.text}</p>
                </div>
              </div>

              <div className="limits__side">
                <ul className={`problem-chips is-${chipState}`} aria-label="Problemas del mundo real">
                  {limites.problems.map((p, i) => (
                    <li key={p.id} className={ev.flash === i && chipState !== 'off' ? 'is-flash' : ''} style={{ transitionDelay: `${chipState === 'off' || ev.flash === i ? 0 : i * 0.07}s` }}>
                      <span className="problem-chips__dot" aria-hidden />
                      {p.label}
                    </li>
                  ))}
                </ul>
              </div>

              <SceneCaption
                text={see.limites[beat]}
                keys={legendFor[beat]}
                extra={
                  beat < 5 && (
                    <div className="scene-tally" aria-label="Recuento en vivo">
                      <span className="is-ok">Llegan bien · {ev.tally.ok}</span>
                      {beat >= 1 && beat < 2 && <span className="is-lost">Se pierden · {ev.tally.lost}</span>}
                      {beat >= 2 && <span className="is-routed">Se desvían · {ev.tally.routed}</span>}
                    </div>
                  )
                }
              />

              <div className="stage-track" aria-label="Evolución de la arquitectura">
                {limites.stages.map((s, i) => (
                  <span key={s} className={`stage-track__item ${stageForBeat[beat] >= i ? 'is-on' : ''} ${stageForBeat[beat] === i ? 'is-now' : ''}`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className={`stage__question ${isQuestion ? 'is-on' : ''}`} aria-hidden={!isQuestion}>
              <span className="kicker kicker--gold">Pregunta al grupo</span>
              <p className="big-question">
                <RevealText text={limites.question} on={isQuestion} stagger={0.07} />
              </p>
              <span className="mono muted">Pausa · escuchamos al grupo</span>
            </div>
            <BeatDots count={6} beat={beat} />
          </>
        )
      }}
    </StorySection>
  )
}
