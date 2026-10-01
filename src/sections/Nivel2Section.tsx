import { lazy } from 'react'
import { nivel2 } from '../data/courseContent'
import { BeatDots, SectionHead, StorySection } from '../components/Section'
import { FallbackFlow, SceneSlot } from '../components/SceneSlot'
import { RevealText } from '../components/RevealText'
import { SlidePane } from '../pdf/OfficialViewer'

const Level2Scene = lazy(() => import('../scenes/Level2Scene'))

export function Nivel2Section() {
  return (
    <StorySection id="nivel2" className="nivel2">
      {({ progress, beat }) => {
        const info = nivel2.beats[Math.min(beat, nivel2.beats.length - 1)]
        const isMsg = beat === 4
        return (
          <>
            <SceneSlot
              className="stage__canvas"
              label="Transformación 3D: una cinta lineal A, B, C se convierte en un sistema ramificado con condiciones, humano y ecosistema"
              fallback={<FallbackFlow labels={['A', 'IF', 'B / C', 'D / E', 'HUMAN']} />}
            >
              {({ visible }) => <Level2Scene visible={visible} progress={progress} beats={5} />}
            </SceneSlot>
            <div className={`stage__dim stage__dim--soft ${isMsg ? 'is-on' : ''}`} aria-hidden />

            <div className={`stage__overlay story-grid ${isMsg ? 'is-faded' : ''}`}>
              <div className="story-col">
                <SectionHead id="nivel2" kicker="Nivel 1 → Nivel 2" />
                <SlidePane page={3} className="story-slide" />
                <div className="story-beat" key={beat}>
                  <span className="mono story-beat__kicker">{info.kicker}</span>
                  <h2 className="story-beat__title">
                    <RevealText text={info.title} on />
                  </h2>
                  <p className="story-beat__text fade is-on">{info.text}</p>
                </div>
              </div>
              <div />
              <div className="stage-track stage-track--two" aria-label="Nivel">
                <span className={`stage-track__item ${beat <= 1 ? 'is-now is-on' : 'is-on'}`}>NIVEL 1 · LINEAL</span>
                <span className={`stage-track__item ${beat >= 2 ? 'is-now is-on' : ''}`}>NIVEL 2 · RAMIFICADO</span>
              </div>
            </div>

            <div className={`stage__question ${isMsg ? 'is-on' : ''}`} aria-hidden={!isMsg}>
              <span className="kicker">Idea clave</span>
              <p className="big-question big-question--md">
                <RevealText text={nivel2.message} on={isMsg} stagger={0.05} />
              </p>
            </div>
            <BeatDots count={5} beat={beat} />
          </>
        )
      }}
    </StorySection>
  )
}
