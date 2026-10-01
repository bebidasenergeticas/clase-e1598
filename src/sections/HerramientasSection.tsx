import { lazy, useEffect, useRef, useState } from 'react'
import { tools, toolsStatement, type ToolId } from '../data/courseContent'
import { ScreenSection, SectionHead } from '../components/Section'
import { FallbackFlow, SceneSlot } from '../components/SceneSlot'
import { RevealText } from '../components/RevealText'
import { Badge } from '../components/Badge'
import { SlidePane } from '../pdf/OfficialViewer'
import { registerStepper } from '../hooks/navigation'
import type { ToolsFocus } from '../scenes/ToolsScene'

const ToolsScene = lazy(() => import('../scenes/ToolsScene'))

const STEPS: { id: ToolsFocus; label: string }[] = [
  { id: 'overview', label: 'Ecosistema' },
  { id: 'zapier', label: 'Zapier' },
  { id: 'make', label: 'Make' },
  { id: 'n8n', label: 'n8n' },
  { id: 'table', label: 'Comparar' },
  { id: 'statement', label: 'Conclusión' },
]

function pageFor(f: ToolsFocus) {
  if (f === 'overview') return toolsStatement.overviewPage
  if (f === 'table' || f === 'statement') return toolsStatement.tablePage
  return tools.find((t) => t.id === f)!.page
}

export function HerramientasSection() {
  const [focus, setFocus] = useState<ToolsFocus>('overview')
  const idx = STEPS.findIndex((s) => s.id === focus)
  const idxRef = useRef(idx)
  idxRef.current = idx

  useEffect(() => {
    registerStepper('herramientas', {
      next: () => {
        if (idxRef.current >= STEPS.length - 1) return false
        setFocus(STEPS[idxRef.current + 1].id)
        return true
      },
      prev: () => {
        if (idxRef.current <= 0) return false
        setFocus(STEPS[idxRef.current - 1].id)
        return true
      },
    })
    return () => registerStepper('herramientas', null)
  }, [])

  const tool = tools.find((t) => t.id === focus)
  const isStatement = focus === 'statement'
  const page = pageFor(focus)
  const officialPages = [4, 5, 6, 7, 8]

  return (
    <ScreenSection id="herramientas" className="tools">
      <div className="stage stage--static">
        <SceneSlot
          className="stage__canvas"
          interactive
          label="Tres módulos 3D: Zapier, Make y n8n, cada uno con un trade-off distinto. Haz clic en un módulo para enfocarlo."
          fallback={<FallbackFlow labels={['ZAPIER', 'MAKE', 'N8N']} accent="#f5a524" />}
        >
          {({ visible }) => <ToolsScene visible={visible} focus={focus} onSelect={(id: ToolId) => setFocus(id)} />}
        </SceneSlot>
        <div className={`stage__dim stage__dim--soft ${isStatement ? 'is-on' : ''}`} aria-hidden />

        <div className={`stage__overlay story-grid tools__grid ${isStatement ? 'is-faded' : ''}`}>
          <div className="story-col">
            <SectionHead id="herramientas" kicker="Zapier / Make / n8n" badge={null} />
            <SlidePane
              page={page}
              pages={officialPages}
              onPageChange={(n) => {
                const s = n === 4 ? 'overview' : n === 8 ? 'table' : (tools.find((t) => t.page === n)?.id ?? 'overview')
                setFocus(s)
              }}
              className="story-slide"
            />
            <div className="tools__focus" key={focus}>
              {tool ? (
                <>
                  <div className="tools__focus-head">
                    <span className="mono tools__k">Trade-off</span>
                    <Badge kind="adaptation" />
                  </div>
                  <h3 className="tools__name">{tool.name}</h3>
                  <p className="tools__trade">
                    <span>{tool.tradeoff[0]}</span> / <span>{tool.tradeoff[1]}</span>
                  </p>
                  <p className="muted">{tool.es} · Lo oficial está en la diapositiva.</p>
                </>
              ) : (
                <>
                  <div className="tools__focus-head">
                    <span className="mono tools__k">{focus === 'table' ? 'Comparar' : 'Ecosistema'}</span>
                    <Badge kind="teacher" />
                  </div>
                  <p className="tools__lead">{focus === 'table' ? 'Mismo problema, tres respuestas distintas. ¿Cuál se ajusta al tuyo?' : 'Distintos trade-offs, no “bueno” o “malo”. Toca un módulo.'}</p>
                </>
              )}
            </div>
          </div>
          <div className="pass" />
          <div className="tools__steps" role="tablist" aria-label="Recorrido de herramientas">
            {STEPS.map((s, i) => (
              <button key={s.id} role="tab" aria-selected={s.id === focus} className={`chip ${s.id === focus ? 'is-on' : i < idx ? 'is-past' : ''}`} onClick={() => setFocus(s.id)}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span> {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`stage__question ${isStatement ? 'is-on' : ''}`} aria-hidden={!isStatement}>
          <p className="big-question">
            <RevealText text={toolsStatement.a} on={isStatement} stagger={0.06} />
          </p>
          <p className={`tools__b fade ${isStatement ? 'is-on' : ''}`} style={{ transitionDelay: '0.7s' }}>
            {toolsStatement.b}
          </p>
        </div>
      </div>
    </ScreenSection>
  )
}
