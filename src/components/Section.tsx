import { useEffect, useRef, type ReactNode } from 'react'
import { sections, type SectionId } from '../data/courseContent'
import { registerSection } from '../hooks/navigation'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { Badge } from './Badge'

export const getMeta = (id: SectionId) => sections.find((s) => s.id === id)!

/** Alto de scroll por beat (en vh) para las secciones storytelling. */
const VH_PER_BEAT = 80

/** Sección con storytelling: escenario sticky + progreso de scroll. */
export function StorySection({
  id,
  className,
  children,
}: {
  id: SectionId
  className?: string
  children: (s: { progress: { current: number }; beat: number }) => ReactNode
}) {
  const meta = getMeta(id)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    registerSection(id, ref.current)
    return () => registerSection(id, null)
  }, [id])
  const { progress, beat } = useScrollProgress(ref, meta.beats)
  return (
    <section
      ref={ref}
      id={id}
      className={`section section--story ${className ?? ''}`}
      style={{ height: `calc(100vh + ${(meta.beats - 1) * VH_PER_BEAT}vh)` }}
      aria-label={`${meta.code} · ${meta.title}`}
      data-beat={beat}
    >
      <div className="stage">{children({ progress, beat })}</div>
    </section>
  )
}

/** Sección de una pantalla. */
export function ScreenSection({ id, className, children }: { id: SectionId; className?: string; children: ReactNode }) {
  const meta = getMeta(id)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    registerSection(id, ref.current)
    return () => registerSection(id, null)
  }, [id])
  return (
    <section ref={ref} id={id} className={`section ${className ?? ''}`} aria-label={`${meta.code} · ${meta.title}`}>
      {children}
    </section>
  )
}

/** Encabezado estándar de sección: código + kicker + badge. */
export function SectionHead({ id, kicker, badge = 'teacher' }: { id: SectionId; kicker?: string; badge?: 'official' | 'teacher' | 'adaptation' | null }) {
  const meta = getMeta(id)
  return (
    <div className="section-head">
      <span className="section-code">{meta.code}</span>
      <span className="kicker">{kicker ?? meta.title}</span>
      {badge && <Badge kind={badge} />}
    </div>
  )
}

/** Indicador de beats (puntos) para secciones storytelling. */
export function BeatDots({ count, beat, labels }: { count: number; beat: number; labels?: string[] }) {
  return (
    <div className="beat-dots" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={i === beat ? 'is-on' : i < beat ? 'is-past' : ''}>
          {labels?.[i] && <em className="mono">{labels[i]}</em>}
        </span>
      ))}
    </div>
  )
}
