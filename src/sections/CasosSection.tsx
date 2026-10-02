import { useState } from 'react'
import { realCases } from '../data/courseContent'
import { ScreenSection, SectionHead } from '../components/Section'
import { FlowDiagram } from '../components/FlowDiagram'

export function CasosSection() {
  const [sel, setSel] = useState(0)
  const c = realCases[sel]
  return (
    <ScreenSection id="casos" className="cases">
      <div className="section-screen">
        <div className="cases__head">
          <SectionHead id="casos" kicker="Casos reales" badge="adaptation" />
          <h2 className="cases__title">
            E1598 <span>— REAL AUTOMATIONS</span>
          </h2>
          <p className="muted cases__note">Temas que el grupo ha trabajado en clase, descritos de forma genérica. Elige uno y pregunta: ¿quién tiene algo parecido?</p>
        </div>

        <div className="cases__grid">
          <div className="case-wall" role="tablist" aria-label="Casos del grupo">
            {realCases.map((rc, i) => (
              <button key={rc.tag} role="tab" aria-selected={i === sel} className={`case-tile ${i === sel ? 'is-on' : ''}`} onClick={() => setSel(i)} style={{ ['--i' as string]: i }}>
                <span className="case-tile__n mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="case-tile__tag">{rc.tag}</span>
                <span className="case-tile__title">{rc.title}</span>
              </button>
            ))}
          </div>

          <article className="case-detail panel" key={sel} aria-live="polite">
            <header className="case-detail__head">
              <span className="mono case-detail__tag">{c.tag}</span>
              <h3>{c.title}</h3>
            </header>
            <div className="case-chain">
              <div className="case-step">
                <span className="mono case-step__k">Problema</span>
                <p>{c.problem}</p>
              </div>
              <div className="case-arrow" aria-hidden />
              <div className="case-step case-step--flow">
                <span className="mono case-step__k">Workflow</span>
                <FlowDiagram steps={c.workflow} perRow={3} title={`Workflow de ${c.title}`} />
              </div>
              <div className="case-arrow" aria-hidden />
              <div className="case-split">
                <div className="case-step case-step--risk">
                  <span className="mono case-step__k">Riesgo</span>
                  <p>{c.risk}</p>
                </div>
                <div className="case-step case-step--out">
                  <span className="mono case-step__k">Output</span>
                  <p>{c.output}</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </ScreenSection>
  )
}
