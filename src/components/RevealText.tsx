import { useEffect, useRef, useState } from 'react'
import { useUI } from '../store/ui'

/** Texto que emerge palabra por palabra desde una máscara. */
export function RevealText({
  text,
  on,
  delay = 0,
  stagger = 0.045,
  className,
}: {
  text: string
  on: boolean
  delay?: number
  stagger?: number
  className?: string
}) {
  const words = text.split(' ')
  return (
    <span className={`reveal-words ${on ? 'is-on' : ''} ${className ?? ''}`} aria-label={text}>
      {words.map((w, i) => (
        <span className="w" key={i} aria-hidden>
          <span style={{ transitionDelay: on ? `${delay + i * stagger}s` : '0s' }}>{w}</span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  )
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>-_'

/** Etiqueta técnica que se "decodifica" al aparecer. */
export function ScrambleText({ text, on = true, duration = 700, className }: { text: string; on?: boolean; duration?: number; className?: string }) {
  const motion = useUI((s) => s.motion)
  const [out, setOut] = useState(on && motion ? '' : text)
  const raf = useRef(0)

  useEffect(() => {
    if (!on) {
      setOut('')
      return
    }
    if (!motion) {
      setOut(text)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / duration)
      const reveal = Math.floor(k * text.length)
      let s = text.slice(0, reveal)
      for (let i = reveal; i < text.length; i++) {
        s += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      }
      setOut(s)
      if (k < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [text, on, motion, duration])

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{out || ' '}</span>
    </span>
  )
}
