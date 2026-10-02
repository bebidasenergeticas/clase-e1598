import { useMemo } from 'react'
import type { StepKind } from '../data/courseContent'
import { useUI } from '../store/ui'

export interface FlowStep {
  kind: StepKind
  label: string
  id?: string
}

export const kindMeta: Record<StepKind, { tag: string; color: string }> = {
  trigger: { tag: 'TRIGGER', color: '#eef1f7' },
  action: { tag: 'ACCIÓN', color: '#6fd3ff' },
  condition: { tag: 'CONDICIÓN', color: '#f5a524' },
  ai: { tag: 'IA', color: '#a996ff' },
  human: { tag: 'HUMANO', color: '#ffc25e' },
  output: { tag: 'OUTPUT', color: '#45e0a0' },
}

const W = 196
const H = 70
const GAP_X = 58
const GAP_Y = 96
const PAD = 26
const TOP = 46

function wrap(text: string, max = 22): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      lines.push(cur)
      cur = w
    } else cur = (cur + ' ' + w).trim()
  }
  if (cur) lines.push(cur)
  if (lines.length > 2) return [lines[0], lines.slice(1).join(' ').slice(0, max - 1) + '…']
  return lines
}

/**
 * Diagrama de workflow animado (SVG): nodos en serpentina, conectores con flujo
 * y un paquete que recorre el camino. Las condiciones muestran su rama "NO".
 */
export function FlowDiagram({ steps, perRow = 4, className, title }: { steps: FlowStep[]; perRow?: number; className?: string; title?: string }) {
  const motion = useUI((s) => s.motion)
  const layout = useMemo(() => {
    const pts = steps.map((_, i) => {
      const row = Math.floor(i / perRow)
      const col = i % perRow
      const c = row % 2 === 0 ? col : perRow - 1 - col
      return { x: PAD + c * (W + GAP_X), y: TOP + row * (H + GAP_Y), row }
    })
    const rows = Math.max(1, Math.ceil(steps.length / perRow))
    const cols = Math.min(perRow, steps.length)
    const width = PAD * 2 + cols * W + (cols - 1) * GAP_X
    const height = TOP + rows * H + (rows - 1) * GAP_Y + PAD
    const centers = pts.map((p) => ({ x: p.x + W / 2, y: p.y + H / 2 }))
    const path = centers.map((c, i) => `${i ? 'L' : 'M'}${c.x},${c.y}`).join(' ')
    return { pts, width, height, centers, path }
  }, [steps, perRow])

  const sig = steps.map((s) => s.kind + s.label).join('|')

  return (
    <svg className={`flow ${className ?? ''}`} viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label={title ?? `Workflow: ${steps.map((s) => s.label).join(' → ')}`} key={sig}>
      <defs>
        <radialGradient id="flow-dot">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="40%" stopColor="#6fd3ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#6fd3ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* conectores */}
      {layout.centers.slice(0, -1).map((a, i) => {
        const b = layout.centers[i + 1]
        const sameRow = layout.pts[i].row === layout.pts[i + 1].row
        const x1 = sameRow ? (b.x > a.x ? a.x + W / 2 : a.x - W / 2) : a.x
        const x2 = sameRow ? (b.x > a.x ? b.x - W / 2 : b.x + W / 2) : b.x
        const y1 = sameRow ? a.y : a.y + H / 2
        const y2 = sameRow ? b.y : b.y - H / 2
        return (
          <g key={`e${i}`} className="flow__edge" style={{ animationDelay: `${i * 0.09 + 0.1}s` }}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="flow__line" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="flow__dash" />
          </g>
        )
      })}

      {/* nodos */}
      {steps.map((s, i) => {
        const p = layout.pts[i]
        const m = kindMeta[s.kind]
        const lines = wrap(s.label)
        const isCond = s.kind === 'condition'
        return (
          <g key={i} className={`flow__node flow__node--${s.kind}`} style={{ animationDelay: `${i * 0.09}s` }} transform={`translate(${p.x} ${p.y})`}>
            {isCond && (
              <g className="flow__no">
                <line x1={W / 2} y1={0} x2={W / 2} y2={-24} />
                <text x={W / 2 + 8} y={-14}>
                  NO → excepción / revisar
                </text>
              </g>
            )}
            <rect width={W} height={H} rx={isCond ? 4 : 12} className="flow__box" style={{ stroke: m.color }} />
            {isCond && <rect x={8} y={H / 2 - 7} width={14} height={14} transform={`rotate(45 ${15} ${H / 2})`} fill="none" stroke={m.color} strokeWidth={1.2} />}
            <rect x={isCond ? 30 : 14} y={13} width={6} height={6} rx={s.kind === 'ai' ? 3 : 1} fill={m.color} />
            <text x={isCond ? 42 : 26} y={20} className="flow__tag" fill={m.color}>
              {m.tag}
            </text>
            {lines.map((l, j) => (
              <text key={j} x={isCond ? 30 : 14} y={40 + j * 16} className="flow__label">
                {l}
              </text>
            ))}
          </g>
        )
      })}

      {motion && steps.length > 1 && (
        <circle r={9} fill="url(#flow-dot)" className="flow__packet">
          <animateMotion dur={`${Math.max(2.4, steps.length * 0.9)}s`} repeatCount="indefinite" path={layout.path} />
        </circle>
      )}
    </svg>
  )
}
