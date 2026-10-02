import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { OFFICIAL_PDF_URL } from './officialSlides'

let docPromise: Promise<PDFDocumentProxy> | null = null
const pagePromises = new Map<number, Promise<PDFPageProxy>>()

/** Carga (una sola vez) el PDF oficial con PDF.js. */
export function loadOfficialPdf(): Promise<PDFDocumentProxy> {
  if (!docPromise) {
    docPromise = (async () => {
      const pdfjs = await import('pdfjs-dist')
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      return pdfjs.getDocument({ url: OFFICIAL_PDF_URL }).promise
    })()
    docPromise.catch(() => {
      docPromise = null
      pagePromises.clear()
    })
  }
  return docPromise
}

export async function getOfficialPage(n: number): Promise<PDFPageProxy> {
  let p = pagePromises.get(n)
  if (!p) {
    p = loadOfficialPdf().then((doc) => doc.getPage(n))
    pagePromises.set(n, p)
  }
  return p
}

/* Caché de páginas ya rasterizadas, para que avanzar/retroceder sea instantáneo. */
const bitmapCache = new Map<string, HTMLCanvasElement>()
const pending = new Map<string, Promise<HTMLCanvasElement>>()
const MAX_CACHE = 36

export function renderOfficialPage(n: number, cssWidth: number, dpr: number): Promise<HTMLCanvasElement> {
  const pxWidth = Math.max(64, Math.round(cssWidth * dpr))
  const key = `${n}@${pxWidth}`
  const cached = bitmapCache.get(key)
  if (cached) return Promise.resolve(cached)
  const inflight = pending.get(key)
  if (inflight) return inflight

  const job = (async () => {
    const page = await getOfficialPage(n)
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: pxWidth / base.width })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Canvas 2D no disponible')
    await page.render({ canvasContext: ctx, viewport }).promise
    bitmapCache.set(key, canvas)
    if (bitmapCache.size > MAX_CACHE) {
      const first = bitmapCache.keys().next().value
      if (first) bitmapCache.delete(first)
    }
    return canvas
  })()
  pending.set(key, job)
  job.finally(() => pending.delete(key)).catch(() => {})
  return job
}
