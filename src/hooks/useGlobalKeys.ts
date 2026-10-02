import { useEffect } from 'react'
import { useUI } from '../store/ui'
import { dispatchCaptured, isTypingTarget } from './keyboard'
import { detectActiveSection, goNext, goPrev, goToSection, toggleFullscreen } from './navigation'
import { openPresentationForActive } from '../components/TeacherDock'

/** Atajos globales del profesor. */
export function useGlobalKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isTypingTarget(e.target)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur()
        return
      }
      if (dispatchCaptured(e)) {
        e.preventDefault()
        return
      }
      const ui = useUI.getState()
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault()
          goNext(e.shiftKey)
          break
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          goPrev(e.shiftKey)
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
        case 'p':
        case 'P':
          openPresentationForActive()
          break
        case 'c':
        case 'C':
          goToSection('clinica')
          break
        case 'q':
        case 'Q':
          goToSection('showme')
          break
        case 'm':
        case 'M':
          ui.toggleDock()
          break
        case 'i':
        case 'I':
          if (!ui.dockVisible) ui.toggleDock()
          ui.setIndexOpen(!ui.indexOpen)
          break
        case 'Home':
          e.preventDefault()
          goToSection('boot')
          break
        case 'Escape':
          if (ui.indexOpen) ui.setIndexOpen(false)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** Mantiene activeSection sincronizada con el scroll. */
export function useActiveSectionTracker() {
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const id = detectActiveSection()
      if (id && id !== useUI.getState().activeSection) useUI.getState().setActiveSection(id)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
}

/** Refleja el estado de animaciones en <html data-motion>. */
export function useMotionAttr() {
  const motion = useUI((s) => s.motion)
  useEffect(() => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off'
  }, [motion])
}
