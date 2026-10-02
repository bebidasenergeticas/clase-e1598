import { lazy, useCallback, useEffect, useRef, useState } from 'react'
import { breakStory, defenses, failures, pipelineNodes, type FailureId } from '../data/courseContent'
import { ScreenSection, SectionHead } from '../components/Section'
import { FallbackFlow, SceneSlot } from '../components/SceneSlot'
import { ScrambleText } from '../components/RevealText'
import { registerStepper } from '../hooks/navigation'
import type { BreakMode, BreakStep } from '../scenes/BreakScene'
import { SceneCaption } from '../components/SceneCaption'

const BreakScene = lazy(() => import('../scenes/BreakScene'))

const titles: Record<BreakMode, string> = {
  happy: 'HAPPY PATH',
  broken: 'BREAK THE WORKFLOW',
  defended: 'DEFENSIVE AUTOMATION',
}
/** Estado de cada nodo en la barra de pasos. */
function stepClass(step: BreakStep, i: number) {
  if (step.status === 'fail') return i === step.node ? 'is-fail' : i > step.node ? 'is-off' : 'is-done'
  if (step.status === 'detour' && i === step.node) return 'is-guard'
  if (step.status === 'done' || i < step.node) return 'is-done'
  return i === step.node ? 'is-now' : ''
}


const subtitles: Record<BreakMode, string> = {
  happy: 'Todo sale bien: un paquete recorre el sistema completo.',
  broken: 'El mundo real no avisa. ¿Dónde se rompe?',
  defended: 'No es programación: es arquitectura y pensamiento.',
}

/** Frase de "qué estás viendo" según el paso actual del paquete. */
function narrate(mode: BreakMode, step: BreakStep, failure: FailureId | null) {
  const f = failures.find((x) => x.id === failure)
  const nodeName = pipelineNodes[step.node]?.label ?? ''
  if (step.status === 'fail' && f) return `Se rompe en ${nodeName}: ${f.label.toLowerCase()}. Lo que sigue ya no ocurre.`
  if (step.status === 'detour' && f && failure) return `Defensa en ${nodeName}: ${f.defenses.join(' + ')} → ${breakStory.detour[failure]}.`
  if (step.status === 'done') return mode === 'happy' ? breakStory.done : `Con la defensa, el registro no se pierde y ${breakStory.logged}.`
  return `${step.node + 1} · ${breakStory.steps[step.node]}`
}

export function RealWorldSection() {
  const [mode, setMode] = useState<BreakMode>('happy')
  const [failure, setFailure] = useState<FailureId | null>(null)
  const [runKey, setRunKey] = useState(0)
  const [step, setStep] = useState<BreakStep>({ node: 0, status: 'travel' })
  const onStep = useCallback((s: BreakStep) => setStep(s), [])
  const state = useRef({ mode, failure })
  state.current = { mode, failure }

  const breakRandom = () => {
    const pool = failures.filter((f) => f.id !== state.current.failure)
    const f = pool[(Math.random() * pool.length) | 0]
    setFailure(f.id)
    setMode('broken')
    setRunKey((k) => k + 1)
  }
  const pick = (id: FailureId) => {
    setFailure(id)
    setMode('broken')
    setRunKey((k) => k + 1)
  }
  const defend = () => {
    if (!state.current.failure) return
    setMode('defended')
    setRunKey((k) => k + 1)
  }
  const reset = () => {
    setMode('happy')
    setRunKey((k) => k + 1)
  }

  // → / ← recorren: happy → break → defensa → siguiente sección
  useEffect(() => {
    registerStepper('realworld', {
      next: () => {
        const s = state.current
        if (s.mode === 'happy') {
          breakRandom()
          return true
        }
        if (s.mode === 'broken') {
          defend()
          return true
        }
        return false
      },
      prev: () => {
        const s = state.current
        if (s.mode === 'defended') {
          setMode('broken')
          return true
        }
        if (s.mode === 'broken') {
          reset()
          return true
        }
        return false
      },
    })
    return () => registerStepper('realworld', null)
  }, [])

  const current = failures.find((f) => f.id === failure)

  return (
    <ScreenSection id="realworld" className="realworld">
      <div className="stage stage--static">
        <SceneSlot
          className="stage__canvas"
          label={`Simulación 3D del workflow: ${titles[mode]}${current && mode !== 'happy' ? ` · ${current.label}` : ''}`}
          fallback={<FallbackFlow labels={['TRIGGER', 'DATOS', 'REGLA', 'CRM', 'NOTIFICAR', 'LOG']} accent={mode === 'broken' ? '#ff5d5d' : '#6fd3ff'} />}
        >
          {({ visible }) => <BreakScene visible={visible} mode={mode} failure={failure} runKey={runKey} onStep={onStep} />}
        </SceneSlot>

        <div className="stage__overlay rw">
          <div className="rw__head">
            <SectionHead id="realworld" kicker="El workflow del mundo real" badge="adaptation" />
            <h2 className={`rw__title is-${mode}`}>
              <ScrambleText text={titles[mode]} key={mode} />
            </h2>
            <p className="rw__sub">{subtitles[mode]}</p>
            <SceneCaption
              text={narrate(mode, step, failure)}
              extra={
                <ol className="rw-steps" aria-label="Recorrido del paquete">
                  {pipelineNodes.map((n, i) => (
                    <li key={n.id} className={stepClass(step, i)}>
                      <span>{n.label}</span>
                    </li>
                  ))}
                </ol>
              }
            />
          </div>

          <aside className={`rw__card panel ${mode === 'happy' ? 'is-hidden' : ''}`} aria-live="polite">
            {current && mode !== 'happy' && (
              <>
                <span className={`mono rw__card-k is-${mode}`}>{mode === 'broken' ? 'Fallo' : 'Defensa'}</span>
                <h3 className="rw__card-t">{current.label}</h3>
                <p>{mode === 'broken' ? current.what : current.fix}</p>
                {mode === 'defended' && (
                  <>
                    <ul className="defense-tags" aria-label="Patrones de defensa">
                      {defenses.map((d) => (
                        <li key={d.id} className={current.defenses.includes(d.id) ? 'is-on' : ''}>
                          {d.id}
                        </li>
                      ))}
                    </ul>
                    <ul className="defense-list">
                      {defenses
                        .filter((d) => current.defenses.includes(d.id))
                        .map((d) => (
                          <li key={d.id} className="is-on">
                            <span className="mono">{d.es}</span>
                            <span>{d.text}</span>
                          </li>
                        ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </aside>

          <div className="rw__controls">
            <div className="rw__buttons">
              <button className={`btn ${mode === 'happy' ? 'btn--primary' : ''}`} onClick={reset}>
                Happy path
              </button>
              <button className="btn btn--danger" onClick={breakRandom}>
                Break the workflow
              </button>
              <button className={`btn ${mode === 'defended' ? 'btn--primary' : 'btn--gold'}`} onClick={defend} disabled={!failure || mode === 'happy'}>
                Defensive automation
              </button>
            </div>
            <div className="rw__failures" role="group" aria-label="Elegir un fallo">
              {failures.map((f) => (
                <button key={f.id} className={`chip ${failure === f.id && mode !== 'happy' ? 'is-on' : ''}`} onClick={() => pick(f.id)} aria-pressed={failure === f.id && mode !== 'happy'}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ScreenSection>
  )
}
