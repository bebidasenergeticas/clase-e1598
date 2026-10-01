import { useEffect, useMemo, useState } from 'react'
import { diagnostic16 } from '../data/courseContent'
import { FlowDiagram, kindMeta } from '../components/FlowDiagram'
import { Badge } from '../components/Badge'
import { IconPrev, IconNext, IconClose } from '../components/Icons'
import { addable, buildFlow, buildHints, emptyClinic, exampleClinic, loadClinic, saveClinic, type ClinicState, type YesNo } from './clinicModel'

function YesNoField({ label, value, onChange }: { label: string; value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <fieldset className="clinic__yn">
      <legend className="mono">{label}</legend>
      {(['si', 'no'] as const).map((v) => (
        <button key={v} type="button" className={`chip ${value === v ? 'is-on' : ''}`} aria-pressed={value === v} onClick={() => onChange(value === v ? '' : v)}>
          {v === 'si' ? 'Sí' : 'No'}
        </button>
      ))}
    </fieldset>
  )
}

export function WorkflowClinic() {
  const [s, setS] = useState<ClinicState>(loadClinic)
  const [tab, setTab] = useState<'flow' | 'diag'>('flow')
  useEffect(() => saveClinic(s), [s])

  const flow = useMemo(() => buildFlow(s), [s])
  const hints = useMemo(() => buildHints(s), [s])
  const set = <K extends keyof ClinicState>(k: K, v: ClinicState[K]) => setS((p) => ({ ...p, [k]: v }))

  const addStep = (kind: (typeof addable)[number]['kind'], label: string) =>
    setS((p) => ({ ...p, extra: [...p.extra, { id: Math.random().toString(36).slice(2, 8), kind, label }] }))
  const editStep = (id: string, label: string) => setS((p) => ({ ...p, extra: p.extra.map((e) => (e.id === id ? { ...e, label } : e)) }))
  const removeStep = (id: string) => setS((p) => ({ ...p, extra: p.extra.filter((e) => e.id !== id) }))
  const moveStep = (id: string, dir: -1 | 1) =>
    setS((p) => {
      const i = p.extra.findIndex((e) => e.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= p.extra.length) return p
      const extra = [...p.extra]
      ;[extra[i], extra[j]] = [extra[j], extra[i]]
      return { ...p, extra }
    })
  const toggleCheck = (i: number) => setS((p) => ({ ...p, checked: p.checked.includes(i) ? p.checked.filter((x) => x !== i) : [...p.checked, i] }))

  return (
    <div className="clinic">
      <form className="clinic__form panel" onSubmit={(e) => e.preventDefault()} aria-label="Datos del workflow del alumno">
        <label className="clinic__field">
          <span className="mono">Problema</span>
          <textarea rows={2} value={s.problem} onChange={(e) => set('problem', e.target.value)} placeholder="¿Qué problema resuelve?" />
        </label>
        <label className="clinic__field">
          <span className="mono">Trigger / input</span>
          <input value={s.trigger} onChange={(e) => set('trigger', e.target.value)} placeholder="Ej. nuevo formulario, correo, horario…" />
        </label>
        <label className="clinic__field">
          <span className="mono">Apps</span>
          <input value={s.apps} onChange={(e) => set('apps', e.target.value)} placeholder="Ej. Sheets, Gmail, Telegram" />
        </label>
        <label className="clinic__field">
          <span className="mono">Output</span>
          <input value={s.output} onChange={(e) => set('output', e.target.value)} placeholder="¿Qué resultado deja?" />
        </label>
        <div className="clinic__yns">
          <YesNoField label="¿Usa IA?" value={s.ai} onChange={(v) => set('ai', v)} />
          <YesNoField label="¿Usa humano?" value={s.human} onChange={(v) => set('human', v)} />
        </div>
        <div className="clinic__formactions">
          <button type="button" className="btn btn--sm" onClick={() => setS(exampleClinic)}>
            Cargar ejemplo
          </button>
          <button type="button" className="btn btn--sm" onClick={() => setS(emptyClinic)}>
            Nuevo caso
          </button>
        </div>
      </form>

      <div className="clinic__board panel">
        <div className="clinic__tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'flow'} className={`chip ${tab === 'flow' ? 'is-on' : ''}`} onClick={() => setTab('flow')}>
            Arquitectura
          </button>
          <button role="tab" aria-selected={tab === 'diag'} className={`chip ${tab === 'diag' ? 'is-on' : ''}`} onClick={() => setTab('diag')}>
            Diagnóstico · 16 preguntas <span className="mono">{s.checked.length}/16</span>
          </button>
          <span className="clinic__badge">
            <Badge kind="teacher" />
          </span>
        </div>

        {tab === 'flow' ? (
          <>
            {s.problem.trim() && <p className="clinic__problem">“{s.problem.trim()}”</p>}
            <div className="clinic__diagram">
              <FlowDiagram steps={flow} perRow={4} title="Arquitectura del workflow del alumno" />
            </div>
            <div className="clinic__add">
              {addable.map((a) => (
                <button key={a.kind} className="chip chip--add" style={{ ['--c' as string]: kindMeta[a.kind].color }} onClick={() => addStep(a.kind, a.default)}>
                  {a.label}
                </button>
              ))}
            </div>
            {s.extra.length > 0 && (
              <ul className="clinic__extra" aria-label="Pasos añadidos">
                {s.extra.map((e, i) => (
                  <li key={e.id} style={{ ['--c' as string]: kindMeta[e.kind].color }}>
                    <span className="mono">{kindMeta[e.kind].tag}</span>
                    <input value={e.label} onChange={(ev) => editStep(e.id, ev.target.value)} aria-label={`Nombre del paso ${i + 1}`} />
                    <button className="icon-btn" onClick={() => moveStep(e.id, -1)} disabled={i === 0} aria-label="Mover antes">
                      <IconPrev />
                    </button>
                    <button className="icon-btn" onClick={() => moveStep(e.id, 1)} disabled={i === s.extra.length - 1} aria-label="Mover después">
                      <IconNext />
                    </button>
                    <button className="icon-btn" onClick={() => removeStep(e.id)} aria-label="Quitar paso">
                      <IconClose />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="clinic__hints">
              <span className="mono">Preguntas para este caso</span>
              <ul>
                {hints.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <ol className="diag16">
            {diagnostic16.map((q, i) => (
              <li key={q}>
                <label className={s.checked.includes(i) ? 'is-on' : ''}>
                  <input type="checkbox" checked={s.checked.includes(i)} onChange={() => toggleCheck(i)} />
                  <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                  <span>{q}</span>
                </label>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
