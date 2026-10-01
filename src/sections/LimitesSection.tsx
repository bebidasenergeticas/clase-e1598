import { lazy } from 'react'
import { limites } from '../data/courseContent'
import { BeatDots, SectionHead, StorySection } from '../components/Section'
import { FallbackFlow, SceneSlot } from '../components/SceneSlot'
import { RevealText } from '../components/RevealText'
import { SlidePane } from '../pdf/OfficialViewer'

const FactoryScene = lazy(() => import('../scenes/FactoryScene'))

const stageForBeat = [0, 0, 1, 2, 3, 3]

export function LimitesSection() {
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
              {({ visible }) => <FactoryScene visible={visible} progress={progress} beats={6} />}
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
                    <li key={p.id} style={{ transitionDelay: `${chipState === 'off' ? 0 : i * 0.07}s` }}>
                      <span className="problem-chips__dot" aria-hidden />
                      {p.label}
                    </li>
                  ))}
                </ul>
              </div>

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
