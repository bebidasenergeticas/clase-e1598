import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { showMe } from '../data/courseContent'
import { ScreenSection, SectionHead } from '../components/Section'
import { registerStepper } from '../hooks/navigation'
import { useKeyCapture } from '../hooks/keyboard'
import { useUI } from '../store/ui'
import { IconNext, IconPrev } from '../components/Icons'

/** step 0 = "¿Quién quiere enseñarnos el suyo?"; 1..6 = preguntas */
const TOTAL = showMe.questions.length

function QuestionStage({ step, big = false }: { step: number; big?: boolean }) {
  const reduce = !useUI((s) => s.motion)
  const isAsk = step === 0
  const text = isAsk ? showMe.ask : showMe.questions[step - 1]
  return (
    <div className={`showme__stage ${big ? 'is-big' : ''}`} aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="showme__q"
          initial={reduce ? false : { opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={reduce ? undefined : { opacity: 0, y: -18, filter: 'blur(6px)' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="mono showme__n">{isAsk ? 'Pregunta al grupo' : `Pregunta ${String(step).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}`}</span>
          <p className="showme__text">{text}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Progress({ step, onGo }: { step: number; onGo: (n: number) => void }) {
  return (
    <div className="showme__progress" role="tablist" aria-label="Preguntas">
      {Array.from({ length: TOTAL + 1 }, (_, i) => (
        <button key={i} role="tab" aria-selected={i === step} aria-label={i === 0 ? 'Inicio' : `Pregunta ${i}`} className={i === step ? 'is-on' : i < step ? 'is-past' : ''} onClick={() => onGo(i)} />
      ))}
    </div>
  )
}

export function ShowMeSection() {
  const [step, setStep] = useState(0)
  const openFloor = useUI((s) => s.openFloor)
  const setOpenFloor = useUI((s) => s.setOpenFloor)
  const stepRef = useRef(step)
  stepRef.current = step

  const next = () => {
    if (stepRef.current >= TOTAL) return false
    setStep(stepRef.current + 1)
    return true
  }
  const prev = () => {
    if (stepRef.current <= 0) return false
    setStep(stepRef.current - 1)
    return true
  }

  useEffect(() => {
    registerStepper('showme', { next, prev })
    return () => registerStepper('showme', null)
  }, [])

  // En OPEN FLOOR el teclado solo mueve preguntas
  useKeyCapture(openFloor, (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter') return next() || true
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') return prev() || true
    if (e.key === 'Escape' || e.key === 'o' || e.key === 'O') {
      setOpenFloor(false)
      return true
    }
    if (e.key === 'f' || e.key === 'F') return false
    return true
  })

  return (
    <ScreenSection id="showme" className="showme">
      <div className="section-screen showme__screen">
        <SectionHead id="showme" kicker="Momento de los alumnos" />
        <h2 className="showme__title">{showMe.title}</h2>
        <QuestionStage step={step} />
        <div className="showme__controls">
          <button className="btn btn--sm" onClick={prev} disabled={step === 0} aria-label="Pregunta anterior">
            <IconPrev className="i" /> Anterior
          </button>
          <Progress step={step} onGo={setStep} />
          <button className="btn btn--sm" onClick={next} disabled={step === TOTAL} aria-label="Siguiente pregunta">
            Siguiente <IconNext className="i" />
          </button>
          <button className="btn btn--gold showme__floor" onClick={() => setOpenFloor(true)}>
            Open floor
          </button>
        </div>
      </div>

      {openFloor && (
        <div className="open-floor" role="dialog" aria-modal="true" aria-label="Open floor: conversación con el grupo">
          <div className="open-floor__top">
            <span className="mono">{showMe.title} · Open floor</span>
            <button className="btn btn--sm" onClick={() => setOpenFloor(false)}>
              Salir · Esc
            </button>
          </div>
          <QuestionStage step={step} big />
          <div className="open-floor__foot">
            <button className="icon-btn" onClick={prev} aria-label="Pregunta anterior">
              <IconPrev />
            </button>
            <Progress step={step} onGo={setStep} />
            <button className="icon-btn" onClick={next} aria-label="Siguiente pregunta">
              <IconNext />
            </button>
          </div>
        </div>
      )}
    </ScreenSection>
  )
}
