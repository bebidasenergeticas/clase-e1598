import { useEffect, useRef } from 'react'

/**
 * Pila de "capturas" de teclado: overlays (presentación, Open Floor, visor en
 * pantalla completa) toman prioridad sobre los atajos globales.
 * El handler devuelve true si consumió la tecla.
 */
type KeyHandler = (e: KeyboardEvent) => boolean

const stack: { handler: { current: KeyHandler } }[] = []

export function dispatchCaptured(e: KeyboardEvent): boolean {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].handler.current(e)) return true
  }
  return false
}

export function useKeyCapture(active: boolean, handler: KeyHandler) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    if (!active) return
    const entry = { handler: ref }
    stack.push(entry)
    return () => {
      const i = stack.indexOf(entry)
      if (i >= 0) stack.splice(i, 1)
    }
  }, [active])
}

export function isTypingTarget(t: EventTarget | null) {
  if (!(t instanceof HTMLElement)) return false
  const tag = t.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
}
