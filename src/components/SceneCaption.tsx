import type { ReactNode } from 'react'
import { legend, type LegendKey } from '../data/courseContent'

/**
 * "Qué estás viendo": una frase que explica la animación 3D en este momento
 * + mini leyenda de colores. Va sobre el área 3D, discreta.
 */
export function SceneCaption({ text, keys, extra, className }: { text: string; keys?: LegendKey[]; extra?: ReactNode; className?: string }) {
  return (
    <div className={`scene-caption ${className ?? ''}`} aria-live="polite">
      <span className="mono scene-caption__k">Qué estás viendo</span>
      <p className="scene-caption__t" key={text}>
        {text}
      </p>
      {extra}
      {keys && keys.length > 0 && (
        <ul className="scene-legend" aria-label="Leyenda de colores">
          {keys.map((k) => (
            <li key={k} className={`scene-legend__i is-${k}`}>
              {legend[k]}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
