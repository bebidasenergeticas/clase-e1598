import { Component, Suspense, useRef, type ReactNode } from 'react'
import { useInView } from '../hooks/useInView'
import { useUI } from '../store/ui'

class SceneErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    console.warn('[scene] WebGL no disponible, se usa fallback:', err)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * Contenedor de una escena 3D:
 * - solo monta el Canvas cuando la sección está cerca del viewport (lazy + libera GPU al alejarse)
 * - indica a la escena si está visible (para suspender el render)
 * - si WebGL falla, muestra un fallback SVG con el mismo concepto
 */
export function SceneSlot({
  children,
  fallback,
  label,
  className,
  interactive = false,
}: {
  children: (state: { visible: boolean }) => ReactNode
  fallback: ReactNode
  label: string
  className?: string
  interactive?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { visible, near } = useInView(ref)
  const webgl = useUI((s) => s.webgl)

  return (
    <div
      ref={ref}
      className={`scene-slot ${className ?? ''}`}
      role={interactive ? 'group' : 'img'}
      aria-label={label}
      style={{ pointerEvents: interactive ? 'auto' : 'none' }}
    >
      {!webgl ? (
        <div className="scene-fallback">{fallback}</div>
      ) : near ? (
        <SceneErrorBoundary fallback={<div className="scene-fallback">{fallback}</div>}>
          <Suspense fallback={<div className="scene-loading mono">Inicializando escena…</div>}>{children({ visible })}</Suspense>
        </SceneErrorBoundary>
      ) : null}
    </div>
  )
}

/** Fallback genérico: diagrama de nodos en SVG. */
export function FallbackFlow({ labels, accent = '#6fd3ff' }: { labels: string[]; accent?: string }) {
  const w = 720
  const step = w / labels.length
  return (
    <svg viewBox={`0 0 ${w} 160`} aria-hidden>
      {labels.map((l, i) => {
        const x = step * i + step / 2
        return (
          <g key={l}>
            {i < labels.length - 1 && <line x1={x + 40} y1={80} x2={x + step - 40} y2={80} stroke={accent} strokeOpacity={0.5} strokeDasharray="4 6" />}
            <rect x={x - 40} y={56} width={80} height={48} rx={8} fill="#0b1224" stroke={accent} strokeOpacity={0.7} />
            <text x={x} y={84} textAnchor="middle" fill="#eef1f7" fontSize="10" fontFamily="JetBrains Mono, monospace" letterSpacing="1">
              {l}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
