import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { sections, type SectionId } from '../data/courseContent'
import { useUI } from '../store/ui'

gsap.registerPlugin(ScrollToPlugin)

/**
 * Navegación del profesor.
 *
 * - Cada sección se registra con su elemento DOM.
 * - Las secciones con storytelling (beats > 1) generan una "parada" por beat.
 * - Una sección puede registrar un "stepper" para manejar pasos internos
 *   (p. ej. preguntas de Show Me o módulos de herramientas). → avanza el paso;
 *   cuando ya no hay más pasos, pasa a la siguiente parada.
 */

export interface Stepper {
  next: () => boolean
  prev: () => boolean
}

const sectionEls = new Map<SectionId, HTMLElement>()
const steppers = new Map<SectionId, Stepper>()

export function registerSection(id: SectionId, el: HTMLElement | null) {
  if (el) sectionEls.set(id, el)
  else sectionEls.delete(id)
}

export function registerStepper(id: SectionId, stepper: Stepper | null) {
  if (stepper) steppers.set(id, stepper)
  else steppers.delete(id)
}

function sectionTop(el: HTMLElement) {
  return el.getBoundingClientRect().top + window.scrollY
}

interface Stop {
  y: number
  id: SectionId
}

function computeStops(): Stop[] {
  const vh = window.innerHeight
  const stops: Stop[] = []
  for (const meta of sections) {
    const el = sectionEls.get(meta.id)
    if (!el) continue
    const top = sectionTop(el)
    if (meta.beats > 1) {
      const travel = Math.max(0, el.offsetHeight - vh)
      for (let i = 0; i < meta.beats; i++) stops.push({ y: Math.round(top + (i / (meta.beats - 1)) * travel), id: meta.id })
    } else {
      stops.push({ y: Math.round(top), id: meta.id })
    }
  }
  return stops
}

function reduced() {
  return !useUI.getState().motion
}

export function scrollToY(y: number, fast = false) {
  gsap.killTweensOf(window)
  if (reduced()) {
    window.scrollTo({ top: y, behavior: 'auto' })
    return
  }
  const distance = Math.abs(window.scrollY - y)
  const duration = fast ? 0.6 : Math.min(1.4, 0.55 + distance / 4000)
  gsap.to(window, { scrollTo: { y, autoKill: true }, duration, ease: 'power2.inOut' })
}

/** Scroll destino del tween en curso (si lo hay), para encadenar pulsaciones rápidas. */
let lastTarget: number | null = null
let lastTargetAt = 0

function currentY() {
  if (lastTarget !== null && performance.now() - lastTargetAt < 900) return lastTarget
  return window.scrollY
}

function go(y: number) {
  lastTarget = y
  lastTargetAt = performance.now()
  scrollToY(y)
}

export function goNext(skipSteps = false) {
  const active = useUI.getState().activeSection
  if (!skipSteps && steppers.get(active)?.next()) return
  const y = currentY()
  const stops = computeStops()
  if (skipSteps) {
    const idx = sections.findIndex((s) => s.id === active)
    const nextMeta = sections[idx + 1]
    const el = nextMeta && sectionEls.get(nextMeta.id)
    if (el) go(sectionTop(el))
    return
  }
  const next = stops.find((s) => s.y > y + 4)
  if (next) go(next.y)
}

export function goPrev(skipSteps = false) {
  const active = useUI.getState().activeSection
  if (!skipSteps && steppers.get(active)?.prev()) return
  const y = currentY()
  if (skipSteps) {
    const idx = sections.findIndex((s) => s.id === active)
    const el = sectionEls.get(active)
    const target = el && Math.abs(sectionTop(el) - y) > 8 ? el : sectionEls.get(sections[Math.max(0, idx - 1)].id)
    if (target) go(sectionTop(target))
    return
  }
  const stops = computeStops()
  const prev = [...stops].reverse().find((s) => s.y < y - 4)
  go(prev ? prev.y : 0)
}

export function goToSection(id: SectionId) {
  const el = sectionEls.get(id)
  if (el) go(sectionTop(el))
}

/** Detecta qué sección ocupa el centro de la pantalla. */
export function detectActiveSection(): SectionId | null {
  const probe = window.innerHeight * 0.45
  let found: SectionId | null = null
  for (const meta of sections) {
    const el = sectionEls.get(meta.id)
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (r.top <= probe && r.bottom > probe) found = meta.id
  }
  return found
}

export function toggleFullscreen(el?: HTMLElement | null) {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  } else {
    ;(el ?? document.documentElement).requestFullscreen?.().catch(() => {})
  }
}
