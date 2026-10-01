import { useEffect, useRef, useState } from 'react'
import { renderOfficialPage } from './pdfDocument'
import { OFFICIAL_PDF_FILE, OFFICIAL_SLIDE_COUNT, slideTitle } from './officialSlides'

/** Las diapositivas del PDF oficial son 720×405 pt (16:9). */
export const SLIDE_ASPECT = 720 / 405

type Status = 'loading' | 'ready' | 'error'

/**
 * Renderiza UNA página del PDF oficial ajustada (contain) a su contenedor.
 * Usa caché de páginas rasterizadas y precarga las vecinas.
 */
export function PdfPage({ page, className, eager = false }: { page: number; className?: string; eager?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const lastPage = useRef(page)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let t: number | undefined
    let first = true
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      window.clearTimeout(t)
      t = window.setTimeout(() => setBox({ w: width, h: height }), first ? 0 : 120)
      first = false
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      window.clearTimeout(t)
    }
  }, [])

  const fitW = box ? Math.max(40, Math.min(box.w, box.h * SLIDE_ASPECT)) : 0
  const fitH = fitW / SLIDE_ASPECT
  // Cuantizar para reutilizar la caché ante pequeños cambios de tamaño
  const renderW = Math.ceil(fitW / 96) * 96

  useEffect(() => {
    if (!fitW && !eager) return
    let cancelled = false
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    renderOfficialPage(page, renderW || 960, dpr)
      .then((src) => {
        if (cancelled) return
        const c = canvasRef.current
        if (!c) return
        if (c.width !== src.width || c.height !== src.height) {
          c.width = src.width
          c.height = src.height
        }
        const ctx = c.getContext('2d')
        ctx?.drawImage(src, 0, 0)
        if (lastPage.current !== page) {
          c.animate?.([{ opacity: 0.25, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 260, easing: 'ease-out' })
          lastPage.current = page
        }
        setStatus('ready')
        // precarga de vecinas
        const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 120))
        idle(() => {
          if (page < OFFICIAL_SLIDE_COUNT) renderOfficialPage(page + 1, renderW || 960, dpr).catch(() => {})
          if (page > 1) renderOfficialPage(page - 1, renderW || 960, dpr).catch(() => {})
        })
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [page, renderW, fitW, eager])

  return (
    <div ref={wrapRef} className={`pdf-page ${className ?? ''}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Diapositiva oficial ${page} de ${OFFICIAL_SLIDE_COUNT}: ${slideTitle(page)}`}
        style={{ width: fitW || undefined, height: fitH || undefined, opacity: status === 'ready' ? 1 : 0 }}
      />
      {status === 'loading' && <div className="pdf-page__state mono">Cargando diapositiva {page}…</div>}
      {status === 'error' && (
        <div className="pdf-page__state pdf-page__state--error">
          <strong>No se pudo cargar el PDF oficial.</strong>
          <span>
            Coloca el archivo en <code>public/assets/{OFFICIAL_PDF_FILE}</code> y recarga.
          </span>
        </div>
      )}
    </div>
  )
}
