import { lazy, useEffect, useRef, useState } from 'react'
import { launchpad, see } from '../data/courseContent'
import { SceneCaption } from '../components/SceneCaption'
import { ScreenSection, SectionHead } from '../components/Section'
import { SceneSlot } from '../components/SceneSlot'
import { ScrambleText } from '../components/RevealText'
import { registerStepper } from '../hooks/navigation'
import { IconCheck } from '../components/Icons'

const LaunchScene = lazy(() => import('../scenes/LaunchScene'))

const empty = () => launchpad.checks.map(() => false)

function LaunchFallback({ checks }: { checks: boolean[] }) {
  return (
    <svg viewBox="-120 -120 240 240" aria-hidden>
      {checks.map((on, i) => {
        const a0 = -Math.PI / 2 + (i / checks.length) * Math.PI * 2 + 0.04
        const a1 = -Math.PI / 2 + ((i + 1) / checks.length) * Math.PI * 2 - 0.04
        const r = 80
        const d = `M ${Math.cos(a0) * r} ${Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${Math.cos(a1) * r} ${Math.sin(a1) * r}`
        return <path key={i} d={d} stroke={on ? '#6fd3ff' : '#1b2440'} strokeWidth={10} fill="none" />
      })}
      <circle r={34} fill="#0c1426" stroke="#f5a524" strokeOpacity={checks.every(Boolean) ? 1 : 0.2} />
    </svg>
  )
}

export function LaunchpadSection() {
  const [checks, setChecks] = useState<boolean[]>(empty)
  const [active, setActive] = useState(false)
  const st = useRef({ checks, active })
  st.current = { checks, active }
  const done = checks.filter(Boolean).length
  const ready = done === checks.length

  // Para leer la máquina: qué check se acaba de marcar y cuál señala el cursor
  const [last, setLast] = useState({ index: -1, key: 0 })
  const [focusIndex, setFocusIndex] = useState<number | null>(null)
  const markLast = (i: number) => setLast((l) => ({ index: i, key: l.key + 1 }))

  const toggle = (i: number) => {
    if (!checks[i]) markLast(i)
    setChecks((c) => c.map((v, j) => (j === i ? !v : v)))
    setActive(false)
  }

  useEffect(() => {
    registerStepper('launchpad', {
      next: () => {
        const { checks: c, active: a } = st.current
        const i = c.indexOf(false)
        if (i >= 0) {
          setChecks(c.map((v, j) => (j === i ? true : v)))
          setLast((l) => ({ index: i, key: l.key + 1 }))
          return true
        }
        if (!a) {
          setActive(true)
          return true
        }
        return false
      },
      prev: () => {
        const { checks: c, active: a } = st.current
        if (a) {
          setActive(false)
          return true
        }
        const i = c.lastIndexOf(true)
        if (i >= 0) {
          setChecks(c.map((v, j) => (j === i ? false : v)))
          return true
        }
        return false
      },
    })
    return () => registerStepper('launchpad', null)
  }, [])

  const litSteps = active ? launchpad.lifecycle.length : Math.round((done / checks.length) * launchpad.lifecycle.length)

  return (
    <ScreenSection id="launchpad" className="launch">
      <div className="stage stage--static">
        <div className="launch__scene">
          <SceneSlot className="stage__canvas" label={`Máquina de lanzamiento: ${done} de ${checks.length} checks completos${active ? ', workflow activo' : ''}`} fallback={<LaunchFallback checks={checks} />}>
            {({ visible }) => <LaunchScene visible={visible} checks={checks} active={active} focusIndex={focusIndex} last={last} />}
          </SceneSlot>
          <div className={`launch__status ${ready ? 'is-ready' : ''} ${active ? 'is-active' : ''}`} aria-live="polite">
            {active ? (
              <ScrambleText className="mono" text="WORKFLOW ACTIVE · MONITORING" />
            ) : ready ? (
              <ScrambleText className="mono" text={launchpad.ready} />
            ) : (
              <span className="mono">
                {String(done).padStart(2, '0')} / {checks.length} CHECKS
              </span>
            )}
          </div>
          <SceneCaption
            className="launch__caption"
            text={active ? see.launchpad.active : ready ? see.launchpad.ready : done === 0 ? see.launchpad.idle : see.launchpad.progress.replace('{n}', String(checks.length - done))}
          />
        </div>

        <div className="stage__overlay launch__layout">
          <div className="launch__left">
            <SectionHead id="launchpad" kicker="Workflow Launchpad" />
            <h2 className="launch__title">
              <span>{launchpad.title[0]}</span>
              <span>{launchpad.title[1]}</span>
            </h2>
            <ol className="checklist" aria-label="Checklist de lanzamiento">
              {launchpad.checks.map((c, i) => (
                <li key={c.code}>
                  <button
                    className={`check ${checks[i] ? 'is-on' : ''}`}
                    aria-pressed={checks[i]}
                    onClick={() => toggle(i)}
                    onMouseEnter={() => setFocusIndex(i)}
                    onMouseLeave={() => setFocusIndex(null)}
                    onFocus={() => setFocusIndex(i)}
                    onBlur={() => setFocusIndex(null)}
                  >
                    <span className="check__box" aria-hidden>
                      {checks[i] && <IconCheck />}
                    </span>
                    <span className="mono check__n">CHECK {String(i + 1).padStart(2, '0')}</span>
                    <span className="mono check__code">{c.code}</span>
                    <span className="check__q">{c.question}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="pass" />

          <div className="launch__bottom">
            <ol className={`lifecycle ${active ? 'is-live' : ''}`} aria-label="Ciclo de producción">
              {launchpad.lifecycle.map((s, i) => (
                <li key={s} className={i < litSteps ? 'is-on' : ''} style={{ ['--i' as string]: i }}>
                  {s}
                </li>
              ))}
            </ol>
            <div className="launch__actions">
              <button className="btn btn--sm" onClick={() => (setChecks(empty()), setActive(false))}>
                Reiniciar
              </button>
              <button className={`btn ${ready ? 'btn--gold' : ''} launch__go ${active ? 'is-active' : ''}`} disabled={!ready} onClick={() => setActive((a) => !a)}>
                {active ? 'Workflow activo ●' : launchpad.activate}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ScreenSection>
  )
}
