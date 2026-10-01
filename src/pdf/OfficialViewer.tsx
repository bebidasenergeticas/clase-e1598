import { useEffect, useRef, useState } from 'react'
import { useUI } from '../store/ui'
import { useKeyCapture } from '../hooks/keyboard'
import { toggleFullscreen } from '../hooks/navigation'
import { PdfPage } from './PdfPage'
import { OFFICIAL_PDF_URL, OFFICIAL_SLIDE_COUNT, slideTitle } from './officialSlides'
import { Badge } from '../components/Badge'
import { IconExpand, IconExternal, IconFullscreen, IconGrid, IconNext, IconPrev } from '../components/Icons'

const pad = (n: number) => String(n).padStart(2, '0')

export function useSlideControls() {
  const slide = useUI((s) => s.slide)
  const setSlide = useUI((s) => s.setSlide)
  const go = (n: number) => setSlide(Math.min(OFFICIAL_SLIDE_COUNT, Math.max(1, n)))
  return { slide, go, next: () => go(slide + 1), prev: () => go(slide - 1) }
}

/**
 * Visor premium de la presentación oficial (PDF original vía PDF.js).
 * - ← / → cuando el visor tiene el foco o está en pantalla completa
 * - pantalla completa del propio visor
 * - tira de miniaturas
 */
export function OfficialViewer({ variant = 'section', onClose }: { variant?: 'section' | 'overlay'; onClose?: () => void }) {
  const { slide, go, next, prev } = useSlideControls()
  const openPresentation = useUI((s) => s.openPresentation)
  const rootRef = useRef<HTMLDivElement>(null)
  const [thumbs, setThumbs] = useState(false)
  const [isFs, setIsFs] = useState(false)

  useEffect(() => {
    const onFs = () => setIsFs(document.fullscreenElement === rootRef.current)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const handleKey = (e: KeyboardEvent | React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
        next()
        return true
      case 'ArrowLeft':
      case 'PageUp':
        prev()
        return true
      case 'Home':
        go(1)
        return true
      case 'End':
        go(OFFICIAL_SLIDE_COUNT)
        return true
      default:
        return false
    }
  }

  // En overlay o en pantalla completa, el visor captura las flechas.
  useKeyCapture(variant === 'overlay' || isFs, (e) => {
    if (e.key === 'Escape' && variant === 'overlay' && !document.fullscreenElement) {
      onClose?.()
      return true
    }
    if ((e.key === 'p' || e.key === 'P') && variant === 'overlay') {
      onClose?.()
      return true
    }
    return handleKey(e)
  })

  return (
    <div
      ref={rootRef}
      className={`viewer viewer--${variant} ${isFs ? 'is-fs' : ''}`}
      tabIndex={-1}
      role="region"
      aria-roledescription="visor de presentación"
      aria-label="Presentación oficial Top Learning"
      onKeyDown={(e) => {
        if (variant === 'section' && !isFs && handleKey(e)) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      <div className="viewer__bar">
        <div className="viewer__meta">
          <Badge kind="official" />
          <span className="viewer__title" aria-live="polite">
            {slideTitle(slide)}
          </span>
        </div>
        <div className="viewer__tools">
          <button className="icon-btn" aria-label="Miniaturas" aria-pressed={thumbs} title="Miniaturas" onClick={() => setThumbs((v) => !v)}>
            <IconGrid />
          </button>
          {variant === 'section' && (
            <button className="icon-btn" aria-label="Ampliar presentación" title="Ampliar (P)" onClick={() => openPresentation(slide)}>
              <IconExpand />
            </button>
          )}
          <button className="icon-btn" aria-label="Pantalla completa del visor" title="Pantalla completa del visor" onClick={() => toggleFullscreen(rootRef.current)}>
            <IconFullscreen />
          </button>
          <a className="icon-btn" href={OFFICIAL_PDF_URL} target="_blank" rel="noreferrer" aria-label="Abrir PDF original en otra pestaña" title="Abrir PDF original">
            <IconExternal />
          </a>
          {onClose && (
            <button className="btn btn--sm" onClick={onClose} aria-label="Cerrar presentación">
              Cerrar · Esc
            </button>
          )}
        </div>
      </div>

      <div className="viewer__stage" onClick={(e) => e.currentTarget.parentElement?.focus()}>
        <PdfPage page={slide} />
        <button className="viewer__hit viewer__hit--prev" aria-label="Diapositiva anterior" onClick={prev} disabled={slide <= 1}>
          <IconPrev />
        </button>
        <button className="viewer__hit viewer__hit--next" aria-label="Diapositiva siguiente" onClick={next} disabled={slide >= OFFICIAL_SLIDE_COUNT}>
          <IconNext />
        </button>
      </div>

      {thumbs && (
        <div className="viewer__thumbs" role="tablist" aria-label="Diapositivas">
          {Array.from({ length: OFFICIAL_SLIDE_COUNT }, (_, i) => i + 1).map((n) => (
            <button key={n} role="tab" aria-selected={n === slide} className={`thumb ${n === slide ? 'is-active' : ''}`} onClick={() => go(n)} title={slideTitle(n)}>
              <PdfPage page={n} />
              <span className="thumb__n mono">{pad(n)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="viewer__foot">
        <button className="btn btn--sm" onClick={prev} disabled={slide <= 1} aria-label="Anterior">
          <IconPrev className="i" /> Anterior
        </button>
        <div className="viewer__count" aria-label={`Diapositiva ${slide} de ${OFFICIAL_SLIDE_COUNT}`}>
          <span className="viewer__num">{pad(slide)}</span>
          <span className="viewer__sep">/</span>
          <span>{pad(OFFICIAL_SLIDE_COUNT)}</span>
          <span className="viewer__progress" aria-hidden>
            <span style={{ width: `${(slide / OFFICIAL_SLIDE_COUNT) * 100}%` }} />
          </span>
        </div>
        <button className="btn btn--sm" onClick={next} disabled={slide >= OFFICIAL_SLIDE_COUNT} aria-label="Siguiente">
          Siguiente <IconNext className="i" />
        </button>
      </div>
    </div>
  )
}

/**
 * Diapositiva oficial incrustada en una sección (no reemplaza al PDF: ES el PDF).
 * Muestra la página indicada; "Ampliar" abre la presentación en esa página.
 */
export function SlidePane({
  page,
  pages,
  onPageChange,
  className,
  caption,
}: {
  page: number
  pages?: number[]
  onPageChange?: (n: number) => void
  className?: string
  caption?: string
}) {
  const openPresentation = useUI((s) => s.openPresentation)
  const idx = pages ? pages.indexOf(page) : -1
  return (
    <figure className={`slide-pane ${className ?? ''}`}>
      <div className="slide-pane__bar">
        <Badge kind="official" />
        <span className="mono slide-pane__n">
          Diap. {pad(page)} / {pad(OFFICIAL_SLIDE_COUNT)}
        </span>
      </div>
      <button className="slide-pane__frame" onClick={() => openPresentation(page)} aria-label={`Ampliar diapositiva oficial ${page}: ${slideTitle(page)}`}>
        <PdfPage page={page} />
        <span className="slide-pane__zoom mono">
          <IconExpand /> Ampliar
        </span>
      </button>
      <figcaption className="slide-pane__cap">
        <span>{caption ?? slideTitle(page)}</span>
        {pages && onPageChange && pages.length > 1 && (
          <span className="slide-pane__nav">
            <button className="icon-btn" aria-label="Diapositiva oficial anterior" disabled={idx <= 0} onClick={() => onPageChange(pages[idx - 1])}>
              <IconPrev />
            </button>
            <button className="icon-btn" aria-label="Diapositiva oficial siguiente" disabled={idx >= pages.length - 1} onClick={() => onPageChange(pages[idx + 1])}>
              <IconNext />
            </button>
          </span>
        )}
      </figcaption>
    </figure>
  )
}

export function PresentationOverlay() {
  const open = useUI((s) => s.presentationOpen)
  const close = useUI((s) => s.closePresentation)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLElement>('.viewer')?.focus()
  }, [open])
  if (!open) return null
  return (
    <div ref={ref} className="presentation-overlay" role="dialog" aria-modal="true" aria-label="Presentación oficial Top Learning">
      <OfficialViewer variant="overlay" onClose={close} />
    </div>
  )
}
