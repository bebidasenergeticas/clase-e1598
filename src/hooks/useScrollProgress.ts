import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Progreso de scroll de una sección "storytelling" (alto > 100vh con escenario sticky).
 * - progress.current: 0..1 continuo (lo leen las escenas 3D en useFrame, sin re-render)
 * - beat: entero 0..beats-1 (lo usa el DOM para cambiar textos)
 */
export function useScrollProgress(ref: React.RefObject<HTMLElement | null>, beats: number) {
  const progress = useRef(0)
  const [beat, setBeat] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progress.current = self.progress
        const b = Math.round(self.progress * (beats - 1))
        setBeat((prev) => (prev === b ? prev : b))
      },
      onRefresh: (self) => {
        progress.current = self.progress
      },
    })
    return () => st.kill()
  }, [ref, beats])

  return { progress, beat }
}

/** Refresca ScrollTrigger cuando cambian fuentes o layout. */
export function refreshScrollTriggers() {
  ScrollTrigger.refresh()
}
