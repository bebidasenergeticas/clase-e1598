import { create } from 'zustand'
import type { SectionId } from '../data/courseContent'

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function detectWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

interface UIState {
  /** Animaciones activas (se respeta prefers-reduced-motion al inicio). */
  motion: boolean
  webgl: boolean
  dockVisible: boolean
  indexOpen: boolean
  activeSection: SectionId
  /** Diapositiva actual de la presentación oficial (1-based). */
  slide: number
  presentationOpen: boolean
  openFloor: boolean
  sessionEnded: boolean

  setMotion: (v: boolean) => void
  toggleMotion: () => void
  toggleDock: () => void
  setIndexOpen: (v: boolean) => void
  setActiveSection: (id: SectionId) => void
  setSlide: (n: number) => void
  openPresentation: (page?: number) => void
  closePresentation: () => void
  setOpenFloor: (v: boolean) => void
  setSessionEnded: (v: boolean) => void
  disableWebGL: () => void
}

export const useUI = create<UIState>((set) => ({
  motion: !prefersReducedMotion(),
  webgl: detectWebGL(),
  dockVisible: true,
  indexOpen: false,
  activeSection: 'boot',
  slide: 1,
  presentationOpen: false,
  openFloor: false,
  sessionEnded: false,

  setMotion: (motion) => set({ motion }),
  toggleMotion: () => set((s) => ({ motion: !s.motion })),
  toggleDock: () => set((s) => ({ dockVisible: !s.dockVisible, indexOpen: false })),
  setIndexOpen: (indexOpen) => set({ indexOpen }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setSlide: (slide) => set({ slide }),
  openPresentation: (page) => set((s) => ({ presentationOpen: true, slide: page ?? s.slide })),
  closePresentation: () => set({ presentationOpen: false }),
  setOpenFloor: (openFloor) => set({ openFloor }),
  setSessionEnded: (sessionEnded) => set({ sessionEnded }),
  disableWebGL: () => set({ webgl: false }),
}))

/** ¿Deben correr las escenas 3D ahora mismo? (pausa cuando hay overlays) */
export function scenesShouldRun(s: UIState) {
  return s.motion && !s.presentationOpen && !s.openFloor && !s.sessionEnded
}
