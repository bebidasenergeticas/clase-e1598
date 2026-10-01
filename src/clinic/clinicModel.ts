import type { StepKind } from '../data/courseContent'
import type { FlowStep } from '../components/FlowDiagram'

/**
 * Modelo de la Workflow Clinic (todo local, sin backend).
 * Para cambiar la arquitectura que se dibuja, edita `buildFlow`.
 * Para cambiar las sugerencias, edita `buildHints`.
 */
export type YesNo = 'si' | 'no' | ''

export interface ClinicStep {
  id: string
  kind: Exclude<StepKind, 'trigger' | 'output'>
  label: string
}

export interface ClinicState {
  problem: string
  trigger: string
  apps: string
  output: string
  ai: YesNo
  human: YesNo
  extra: ClinicStep[]
  checked: number[]
}

export const emptyClinic: ClinicState = { problem: '', trigger: '', apps: '', output: '', ai: '', human: '', extra: [], checked: [] }

export const exampleClinic: ClinicState = {
  problem: 'Responder rápido a prospectos sin perder ninguno',
  trigger: 'Nuevo formulario de contacto',
  apps: 'Google Sheets, Gmail, Telegram',
  output: 'Prospecto registrado y respuesta enviada',
  ai: 'si',
  human: 'si',
  extra: [{ id: 'ex1', kind: 'condition', label: '¿Ya existe en el CRM?' }],
  checked: [],
}

export const addable: { kind: ClinicStep['kind']; label: string; default: string }[] = [
  { kind: 'action', label: '+ ACTION', default: 'Nueva acción' },
  { kind: 'condition', label: '+ CONDITION', default: '¿Se cumple la condición?' },
  { kind: 'human', label: '+ HUMAN', default: 'Aprobación humana' },
  { kind: 'ai', label: '+ AI', default: 'IA: interpretar' },
]

/** INPUT → PROCESS → DECISION → ACTION → OUTPUT (+ IA, humano y pasos añadidos). */
export function buildFlow(s: ClinicState): FlowStep[] {
  const apps = s.apps.trim()
  const flow: FlowStep[] = [
    { kind: 'trigger', label: s.trigger.trim() || 'Trigger / input' },
    { kind: 'action', label: apps ? `Procesar datos · ${apps.split(',')[0].trim()}` : 'Procesar datos' },
  ]
  if (s.ai === 'si') flow.push({ kind: 'ai', label: 'IA: interpretar / clasificar' })
  flow.push({ kind: 'condition', label: '¿Cumple la regla?' })
  s.extra.forEach((e) => flow.push({ kind: e.kind, label: e.label || '(sin nombre)', id: e.id }))
  if (s.human === 'si') flow.push({ kind: 'human', label: 'Revisión / aprobación humana' })
  const lastApp = apps ? apps.split(',').slice(-1)[0].trim() : ''
  flow.push({ kind: 'action', label: lastApp ? `Ejecutar acción · ${lastApp}` : 'Ejecutar acción' })
  flow.push({ kind: 'output', label: s.output.trim() || 'Output' })
  return flow
}

/** Preguntas sugeridas (complemento del profesor), deterministas. */
export function buildHints(s: ClinicState): string[] {
  const h: string[] = []
  if (!s.problem.trim()) h.push('Define el problema en una sola frase.')
  if (!s.trigger.trim()) h.push('¿Qué lo inicia exactamente y qué datos trae?')
  if (s.ai === 'si' && s.human !== 'si') h.push('La IA interpreta: ¿quién revisa su output antes de que salga?')
  if (s.ai === 'si') h.push('¿Ese paso de IA es realmente ambiguo, o lo resuelve una regla?')
  if (/sheet|crm|base|airtable|notion/i.test(s.apps)) h.push('¿Qué pasa si el registro ya existe? (duplicados)')
  if (/gmail|correo|mail|telegram|whatsapp|slack/i.test(s.apps)) h.push('¿Qué pasa si el envío falla? ¿Hay reintento y log?')
  if (!s.output.trim()) h.push('¿Cómo sabrás que funcionó? Define el output.')
  h.push('¿Dónde revisas los logs mañana?')
  return h.slice(0, 4)
}

const KEY = 'e1598-clinic-v1'

export function loadClinic(): ClinicState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...emptyClinic, ...JSON.parse(raw) }
  } catch {
    /* sin almacenamiento disponible */
  }
  return emptyClinic
}

export function saveClinic(s: ClinicState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignorar */
  }
}
