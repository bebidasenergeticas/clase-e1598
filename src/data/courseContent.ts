/**
 * CONTENIDO PEDAGÓGICO COMPLEMENTARIO — E1598 · Semana 9
 *
 * Todo lo que está en este archivo es COMPLEMENTO DEL PROFESOR o ADAPTACIÓN
 * PEDAGÓGICA. La presentación oficial de Top Learning NO se transcribe aquí:
 * se muestra siempre desde el PDF original (ver src/pdf/officialSlides.ts).
 *
 * Para editar textos de la clase, casos del grupo, checks del Launchpad,
 * preguntas o reglas, modifica solo este archivo.
 */

/* ------------------------------------------------------------------ */
/* Secciones                                                            */
/* ------------------------------------------------------------------ */

export type SectionId =
  | 'boot'
  | 'oficial'
  | 'limites'
  | 'nivel2'
  | 'realworld'
  | 'ia'
  | 'herramientas'
  | 'casos'
  | 'launchpad'
  | 'showme'
  | 'clinica'
  | 'reglas'
  | 'cierre'

export interface SectionMeta {
  id: SectionId
  code: string
  title: string
  /** Número de "beats" de scroll storytelling. 1 = pantalla única. */
  beats: number
  /** Diapositiva oficial relacionada (para la tecla P). */
  slide?: number
}

export const sections: SectionMeta[] = [
  { id: 'boot', code: '00', title: 'Boot', beats: 2, slide: 1 },
  { id: 'oficial', code: '01', title: 'Presentación oficial', beats: 1, slide: 1 },
  { id: 'limites', code: '02', title: 'Cuando lo básico se queda corto', beats: 6, slide: 2 },
  { id: 'nivel2', code: '03', title: 'Nivel 1 → Nivel 2', beats: 5, slide: 3 },
  { id: 'realworld', code: '04', title: 'El workflow del mundo real', beats: 1, slide: 2 },
  { id: 'ia', code: '05', title: 'IA: ¿sí o no?', beats: 4 },
  { id: 'herramientas', code: '06', title: 'Zapier / Make / n8n', beats: 1, slide: 4 },
  { id: 'casos', code: '07', title: 'Casos reales E1598', beats: 1 },
  { id: 'launchpad', code: '08', title: 'Workflow Launchpad', beats: 1, slide: 9 },
  { id: 'showme', code: '09', title: 'Show me your workflow', beats: 1 },
  { id: 'clinica', code: '10', title: 'Workflow Clinic', beats: 1 },
  { id: 'reglas', code: '11', title: 'Las 5 reglas', beats: 6, slide: 10 },
  { id: 'cierre', code: '12', title: 'Cierre del módulo', beats: 5, slide: 12 },
]

/* ------------------------------------------------------------------ */
/* 00 · Boot                                                            */
/* ------------------------------------------------------------------ */

export const boot = {
  title: 'AUTOMATION SYSTEMS',
  tagline: 'FROM WORKFLOW → PRODUCTION',
  code: 'E1598 / WEEK 09',
  session: 'FINAL AUTOMATION SESSION',
  subtitle: 'E1598 · Semana 9 · Cierre de Automatización Básica',
  lines: ['Diseñar un workflow es solo el principio.', 'Hoy lo ponemos en marcha.'],
  philosophy: {
    a: 'Ya construiste o diseñaste un workflow.',
    b: 'Ahora vamos a convertirlo en algo que realmente puedas poner en marcha.',
  },
  /** Recap visual de 30–60 s: lo que el grupo ya domina. */
  recap: [
    'Trigger',
    'Nodos',
    'Datos',
    'Mapping',
    'IF · Switch',
    'APIs',
    'Credenciales',
    'Sheets como CRM',
    'Gmail · Telegram',
    'IA · OpenRouter',
    'Agentes',
    'Human-in-the-loop',
    'Logs',
  ],
}

/* ------------------------------------------------------------------ */
/* 01 · Mapa: diapositiva oficial → explicación visual                  */
/* ------------------------------------------------------------------ */

export interface SlideCompanion {
  page: number
  section?: SectionId
  note: string
}

export const slideCompanions: SlideCompanion[] = [
  { page: 1, section: 'boot', note: 'Arranque de la segunda parte de la sesión.' },
  { page: 2, section: 'limites', note: 'Fábrica 3D: lo lineal funciona… hasta que llega el mundo real.' },
  { page: 3, section: 'nivel2', note: 'Transformación 3D: de una cinta lineal a un sistema ramificado.' },
  { page: 4, section: 'herramientas', note: 'Tres módulos, tres trade-offs. Ninguno es “el mejor”.' },
  { page: 5, section: 'herramientas', note: 'Módulo ZAPIER · velocidad / simplicidad.' },
  { page: 6, section: 'herramientas', note: 'Módulo MAKE · visual / flexibilidad.' },
  { page: 7, section: 'herramientas', note: 'Módulo N8N · control / extensibilidad.' },
  { page: 8, section: 'herramientas', note: 'Vista comparativa de los tres módulos.' },
  { page: 9, section: 'launchpad', note: 'Del plan a la puesta en marcha: checklist de lanzamiento.' },
  { page: 10, section: 'reglas', note: 'Cierre visual: las 5 reglas del módulo.' },
  { page: 11, note: 'Fuentes oficiales de la presentación.' },
  { page: 12, section: 'cierre', note: 'Fin de capítulo: Automatización Básica completa.' },
]

/* ------------------------------------------------------------------ */
/* 02 · Cuando lo básico se queda corto                                 */
/* ------------------------------------------------------------------ */

export const limites = {
  stages: ['LINEAR', 'BRANCHING', 'EXCEPTIONS', 'RESILIENCE'],
  beats: [
    { kicker: 'LINEAR', title: 'Todo funciona.', text: 'Un input, un proceso, un output. Los datos viajan sin fricción.' },
    { kicker: 'MUNDO REAL', title: 'Y entonces llega el lunes.', text: 'Los datos reales no siempre llegan como en la prueba.' },
    { kicker: 'BRANCHING', title: 'Una sola vía ya no alcanza.', text: 'Cada problema necesita su propio camino.' },
    { kicker: 'EXCEPTIONS', title: 'Cada excepción, un destino.', text: 'Lo que no encaja no detiene todo: se desvía, se revisa, se registra.' },
    { kicker: 'RESILIENCE', title: 'Un sistema que aguanta.', text: 'No es el que nunca falla. Es el que sabe qué hacer cuando falla.' },
  ],
  problems: [
    { id: 'empty', label: 'Dato vacío' },
    { id: 'dup', label: 'Duplicado' },
    { id: 'api', label: 'API offline' },
    { id: 'cred', label: 'Credencial vencida' },
    { id: 'format', label: 'Formato incorrecto' },
    { id: 'human', label: 'Cliente pide humano' },
    { id: 'volume', label: 'Gran volumen' },
    { id: 'branch', label: 'Nueva bifurcación' },
  ],
  question: '¿QUÉ ROMPERÍA TU WORKFLOW MAÑANA?',
}

/* ------------------------------------------------------------------ */
/* 03 · Nivel 1 → Nivel 2                                               */
/* ------------------------------------------------------------------ */

export const nivel2 = {
  beats: [
    { kicker: 'NIVEL 1', title: 'A → B → C', text: 'Una cinta transportadora: un evento, un camino.' },
    { kicker: 'PRIMERA CONDICIÓN', title: 'Aparece un “si…”', text: 'El flujo empieza a preguntar antes de avanzar.' },
    { kicker: 'NIVEL 2', title: 'El camino se ramifica.', text: 'Ramas, sub-ramas y una persona que decide.' },
    { kicker: 'VISTA COMPLETA', title: 'Todo lo que vive alrededor.', text: 'No es programación avanzada: es reconocer las piezas.' },
    { kicker: 'IDEA CLAVE', title: '', text: '' },
  ],
  satellites: [
    'CONDICIONES',
    'BUCLES',
    'ARRAYS',
    'WEBHOOKS',
    'BASE DE DATOS',
    'SCRIPTS',
    'EXCEPCIONES',
    'HUMAN APPROVAL',
  ],
  message: 'La complejidad aparece cuando deja de existir un único camino.',
}

/* ------------------------------------------------------------------ */
/* 04 · El workflow del mundo real                                      */
/* ------------------------------------------------------------------ */

export const pipelineNodes = [
  { id: 'trigger', label: 'TRIGGER', sub: 'Formulario' },
  { id: 'data', label: 'DATOS', sub: 'Mapping' },
  { id: 'rule', label: 'REGLA', sub: 'IF / Switch' },
  { id: 'crm', label: 'CRM', sub: 'Google Sheets' },
  { id: 'notify', label: 'NOTIFICAR', sub: 'Gmail' },
  { id: 'log', label: 'LOG', sub: 'Registro' },
] as const

export type DefenseId = 'VALIDATE' | 'FILTER' | 'RETRY' | 'LOG' | 'DEDUPLICATE' | 'ESCALATE'

export const defenses: { id: DefenseId; es: string; text: string }[] = [
  { id: 'VALIDATE', es: 'Validar', text: 'Revisa que el dato exista y tenga el formato esperado.' },
  { id: 'FILTER', es: 'Filtrar', text: 'Deja pasar solo lo que cumple; lo demás se desvía.' },
  { id: 'RETRY', es: 'Reintentar', text: 'Si un servicio no responde, vuelve a intentar con espera.' },
  { id: 'LOG', es: 'Registrar', text: 'Deja huella de qué pasó, cuándo y con qué datos.' },
  { id: 'DEDUPLICATE', es: 'Deduplicar', text: 'Busca antes de crear: actualizar en vez de repetir.' },
  { id: 'ESCALATE', es: 'Escalar', text: 'Cuando una regla no alcanza, decide una persona.' },
]

export type FailureId = 'EMPTY_EMAIL' | 'DUPLICATE' | 'API_TIMEOUT' | 'CREDENTIAL_EXPIRED' | 'INVALID_FORMAT' | 'HUMAN_REQUIRED'

export interface FailureScenario {
  id: FailureId
  label: string
  /** índice del nodo de pipelineNodes donde se manifiesta */
  node: number
  what: string
  fix: string
  defenses: DefenseId[]
}

export const failures: FailureScenario[] = [
  {
    id: 'EMPTY_EMAIL',
    label: 'EMAIL VACÍO',
    node: 1,
    what: 'El formulario llegó sin email. Nadie lo detiene y el CRM guarda un registro inútil.',
    fix: 'Validar campos obligatorios antes de escribir. Si falta algo, desviar a revisión.',
    defenses: ['VALIDATE', 'FILTER', 'LOG'],
  },
  {
    id: 'DUPLICATE',
    label: 'REGISTRO DUPLICADO',
    node: 3,
    what: 'El mismo cliente envió el formulario dos veces: dos filas, dos correos.',
    fix: 'Buscar antes de crear. Si ya existe, actualizar en lugar de duplicar.',
    defenses: ['DEDUPLICATE', 'LOG'],
  },
  {
    id: 'API_TIMEOUT',
    label: 'API TIMEOUT',
    node: 4,
    what: 'El servicio de correo no respondió a tiempo y la ejecución se detuvo.',
    fix: 'Reintentar con espera. Si persiste, registrar y avisar.',
    defenses: ['RETRY', 'LOG'],
  },
  {
    id: 'CREDENTIAL_EXPIRED',
    label: 'CREDENTIAL EXPIRED',
    node: 3,
    what: 'La conexión con Sheets venció. El flujo falla… y nadie se entera.',
    fix: 'Registrar el error y avisar al responsable para reconectar la credencial.',
    defenses: ['LOG', 'ESCALATE'],
  },
  {
    id: 'INVALID_FORMAT',
    label: 'INVALID FORMAT',
    node: 2,
    what: 'La fecha llegó como texto libre. La condición no puede evaluarla.',
    fix: 'Normalizar el formato antes de decidir y filtrar lo que no cumple.',
    defenses: ['VALIDATE', 'FILTER'],
  },
  {
    id: 'HUMAN_REQUIRED',
    label: 'HUMAN REQUIRED',
    node: 2,
    what: 'El cliente pide hablar con una persona. Ninguna regla cubre este caso.',
    fix: 'Escalar a una persona (human-in-the-loop) y registrar su decisión.',
    defenses: ['ESCALATE', 'LOG'],
  },
]

/* ------------------------------------------------------------------ */
/* 05 · IA: ¿sí o no?                                                   */
/* ------------------------------------------------------------------ */

export const ia = {
  beats: [
    { kicker: 'LA PREGUNTA', title: '¿Este paso necesita IA?' },
    { kicker: 'DOS CAMINOS', title: 'Reglas o interpretación.' },
    { kicker: 'IDEA CLAVE', title: '' },
    { kicker: 'TU TURNO', title: '¿Regla o IA?' },
  ],
  deterministic: ['Fecha', 'Cálculo', 'Mover archivo', 'Validar campo', 'Enviar registro', 'Sincronizar base de datos'],
  interpretative: ['Clasificar intención', 'Interpretar texto', 'Resumir', 'Redactar respuesta', 'Analizar ambigüedad'],
  statement: 'NO TODA AUTOMATIZACIÓN NECESITA IA.',
  ruleEs: ['Usa IA para la ambigüedad.', 'Usa reglas para la certeza.'],
  ruleEn: 'USE AI FOR AMBIGUITY. USE RULES FOR CERTAINTY.',
  quiz: [
    { task: 'Calcular el total de una factura', answer: 'rule' as const },
    { task: 'Detectar si un mensaje es una queja', answer: 'ai' as const },
    { task: 'Mover un archivo a la carpeta del cliente', answer: 'rule' as const },
    { task: 'Resumir una conversación larga', answer: 'ai' as const },
    { task: 'Verificar que el email tenga formato válido', answer: 'rule' as const },
    { task: 'Redactar una respuesta personalizada', answer: 'ai' as const },
  ],
}

/* ------------------------------------------------------------------ */
/* 06 · Herramientas                                                    */
/* ------------------------------------------------------------------ */

export type ToolId = 'zapier' | 'make' | 'n8n'

export const tools: { id: ToolId; name: string; tradeoff: [string, string]; es: string; page: number }[] = [
  { id: 'zapier', name: 'ZAPIER', tradeoff: ['SPEED', 'SIMPLICITY'], es: 'Velocidad · Simplicidad', page: 5 },
  { id: 'make', name: 'MAKE', tradeoff: ['VISUAL', 'FLEXIBILITY'], es: 'Visual · Flexibilidad', page: 6 },
  { id: 'n8n', name: 'N8N', tradeoff: ['CONTROL', 'EXTENSIBILITY'], es: 'Control · Extensibilidad', page: 7 },
]

export const toolsStatement = {
  a: 'NO EXISTE LA MEJOR HERRAMIENTA.',
  b: 'Existe la adecuada para el problema.',
  overviewPage: 4,
  tablePage: 8,
}

/* ------------------------------------------------------------------ */
/* 07 · Casos reales E1598                                              */
/* ------------------------------------------------------------------ */

export type StepKind = 'trigger' | 'action' | 'condition' | 'ai' | 'human' | 'output'

export interface CaseStep {
  kind: StepKind
  label: string
}

export interface RealCase {
  tag: string
  title: string
  problem: string
  workflow: CaseStep[]
  risk: string
  output: string
}

/**
 * Casos inspirados en lo que el grupo E1598 ha trabajado en clase.
 * Son descripciones genéricas (sin nombres ni datos reales).
 * Para añadir un caso: copia un objeto y edita sus campos.
 */
export const realCases: RealCase[] = [
  {
    tag: 'COSTOS',
    title: 'Seguimiento de costos',
    problem: 'Los gastos se registran tarde y en lugares distintos; nadie ve el total a tiempo.',
    workflow: [
      { kind: 'trigger', label: 'Nuevo gasto (formulario o correo)' },
      { kind: 'action', label: 'Extraer monto, fecha y categoría' },
      { kind: 'condition', label: '¿Supera el presupuesto?' },
      { kind: 'action', label: 'Registrar en Google Sheets' },
      { kind: 'output', label: 'Alerta por Telegram si se excede' },
    ],
    risk: 'Montos con formatos distintos (comas, moneda) o gastos registrados dos veces.',
    output: 'Hoja de costos al día y aviso cuando algo se sale del presupuesto.',
  },
  {
    tag: 'PAGOS',
    title: 'Estados de cuenta y recordatorios',
    problem: 'Revisar a mano quién debe y recordar fechas de pago consume tiempo y se olvida.',
    workflow: [
      { kind: 'trigger', label: 'Programado: cada mañana' },
      { kind: 'action', label: 'Leer clientes y vencimientos en Sheets' },
      { kind: 'condition', label: '¿Vence pronto y sigue pendiente?' },
      { kind: 'human', label: 'Revisión antes de enviar (opcional)' },
      { kind: 'output', label: 'Recordatorio por Gmail + registro' },
    ],
    risk: 'Recordar a quien ya pagó, o enviar el mismo recordatorio dos veces.',
    output: 'Recordatorios a tiempo y registro de cada envío.',
  },
  {
    tag: 'SERVICIOS',
    title: 'Gestión de servicios vehiculares',
    problem: 'Las solicitudes de servicio llegan por varios canales y se pierde el seguimiento.',
    workflow: [
      { kind: 'trigger', label: 'Solicitud de servicio' },
      { kind: 'action', label: 'Registrar unidad, servicio y fecha' },
      { kind: 'condition', label: 'Switch: tipo de servicio' },
      { kind: 'human', label: 'Aprobación del responsable' },
      { kind: 'output', label: 'Aviso al cliente con el estado' },
    ],
    risk: 'Datos de la unidad incompletos o solicitudes sin responsable asignado.',
    output: 'Cada servicio con responsable, estado y aviso al cliente.',
  },
  {
    tag: 'CRM',
    title: 'CRM en Google Sheets',
    problem: 'Los prospectos llegan por formulario o correo y nadie les da seguimiento.',
    workflow: [
      { kind: 'trigger', label: 'Nuevo prospecto' },
      { kind: 'action', label: 'Validar email y teléfono' },
      { kind: 'condition', label: '¿Ya existe en el CRM?' },
      { kind: 'action', label: 'Crear o actualizar fila' },
      { kind: 'output', label: 'Aviso al vendedor asignado' },
    ],
    risk: 'Registros duplicados y campos vacíos que ensucian el CRM.',
    output: 'Un CRM limpio, con cada prospecto asignado.',
  },
  {
    tag: 'SOPORTE',
    title: 'Atención a clientes',
    problem: 'Las preguntas repetidas saturan al equipo, pero algunos casos sí necesitan a una persona.',
    workflow: [
      { kind: 'trigger', label: 'Mensaje de cliente (Telegram / correo)' },
      { kind: 'ai', label: 'Clasificar intención' },
      { kind: 'condition', label: 'Switch: frecuente / queja / otro' },
      { kind: 'ai', label: 'Redactar respuesta sugerida' },
      { kind: 'human', label: 'Escalar si pide hablar con alguien' },
      { kind: 'output', label: 'Respuesta + registro de la conversación' },
    ],
    risk: 'Que la IA responda algo incorrecto o no detecte que el cliente quiere a una persona.',
    output: 'Respuestas rápidas a lo frecuente y escalamiento claro de lo sensible.',
  },
  {
    tag: 'CORREO',
    title: 'Clasificación de correos',
    problem: 'La bandeja mezcla facturas, clientes y avisos; lo urgente se pierde.',
    workflow: [
      { kind: 'trigger', label: 'Nuevo correo en Gmail' },
      { kind: 'condition', label: '¿Lo resuelve una regla? (remitente / asunto)' },
      { kind: 'ai', label: 'Clasificar solo lo ambiguo' },
      { kind: 'action', label: 'Aplicar etiqueta' },
      { kind: 'output', label: 'Alerta si es urgente' },
    ],
    risk: 'Usar IA para algo que una regla resolvía; etiquetas mal asignadas.',
    output: 'Bandeja ordenada y alertas solo para lo urgente.',
  },
  {
    tag: 'CONTENIDO',
    title: 'Contenido para redes sociales',
    problem: 'Preparar copy, tags y calendario de cada publicación toma demasiado tiempo.',
    workflow: [
      { kind: 'trigger', label: 'Nuevo archivo en Google Drive' },
      { kind: 'ai', label: 'Generar copy y tags' },
      { kind: 'human', label: 'Aprobar o editar' },
      { kind: 'action', label: 'Programar publicación' },
      { kind: 'output', label: 'Calendario de contenido actualizado' },
    ],
    risk: 'Publicar sin revisión, o recibir un archivo con nombre o formato inesperado.',
    output: 'Publicaciones programadas con copy aprobado.',
  },
  {
    tag: 'DOCUMENTOS',
    title: 'Recepción de dibujos y documentos',
    problem: 'Los archivos llegan por correo o mensaje y terminan dispersos.',
    workflow: [
      { kind: 'trigger', label: 'Archivo recibido' },
      { kind: 'condition', label: '¿Tipo y tamaño válidos?' },
      { kind: 'action', label: 'Renombrar con una convención' },
      { kind: 'action', label: 'Guardar en carpeta de Drive' },
      { kind: 'output', label: 'Registro en Sheets + confirmación' },
    ],
    risk: 'Archivos sin nombre claro, formatos no válidos o duplicados.',
    output: 'Carpeta ordenada y registro de cada documento recibido.',
  },
  {
    tag: 'DATOS',
    title: 'Dashboards y análisis de datos',
    problem: 'Los datos viven en varias hojas y el reporte se arma a mano.',
    workflow: [
      { kind: 'trigger', label: 'Programado: cada semana' },
      { kind: 'action', label: 'Reunir datos de varias hojas' },
      { kind: 'action', label: 'Calcular indicadores (reglas)' },
      { kind: 'ai', label: 'Resumir hallazgos (opcional)' },
      { kind: 'output', label: 'Dashboard actualizado + resumen' },
    ],
    risk: 'Datos incompletos que cambian el resultado sin que nadie lo note.',
    output: 'Dashboard al día y un resumen listo para leer.',
  },
  {
    tag: 'ALERTAS',
    title: 'Alertas',
    problem: 'Te enteras tarde de lo que importa: un pago, un error, un límite.',
    workflow: [
      { kind: 'trigger', label: 'Evento o revisión programada' },
      { kind: 'condition', label: '¿Cumple la condición de alerta?' },
      { kind: 'action', label: 'Evitar alertas repetidas' },
      { kind: 'output', label: 'Aviso por Telegram + registro' },
    ],
    risk: 'Demasiadas alertas (nadie las lee) o ninguna cuando la API falla.',
    output: 'Pocas alertas, oportunas y con registro.',
  },
]

/* ------------------------------------------------------------------ */
/* 08 · Workflow Launchpad                                              */
/* ------------------------------------------------------------------ */

export const launchpad = {
  title: ['TU WORKFLOW YA EXISTE.', 'AHORA HAY QUE LANZARLO.'],
  checks: [
    { code: 'PROBLEM', question: '¿Resuelve un problema concreto?' },
    { code: 'INPUT', question: '¿Sé exactamente qué lo inicia y qué datos recibe?' },
    { code: 'CONNECTIONS', question: '¿Mis credenciales y aplicaciones están conectadas?' },
    { code: 'MAPPING', question: '¿Cada dato llega al campo correcto?' },
    { code: 'HAPPY PATH', question: '¿Funciona cuando todo sale bien?' },
    { code: 'BREAK TEST', question: '¿Qué pasa si algo llega mal?' },
    { code: 'HUMAN', question: '¿Hay un momento donde debe decidir una persona?' },
    { code: 'LOGS', question: '¿Sé dónde revisar qué ocurrió?' },
    { code: 'ACTIVATE', question: '¿Está realmente activo o solo funciona manualmente?' },
    { code: 'MONITOR', question: '¿Cómo sabré mañana que sigue funcionando?' },
    { code: 'VALUE', question: '¿Qué tiempo, dinero o trabajo me ahorra?' },
  ],
  ready: 'SYSTEM READY',
  activate: 'ACTIVATE WORKFLOW',
  /** Cierre conceptual: el ciclo de producción. */
  lifecycle: ['DISEÑAR', 'CONSTRUIR', 'CONECTAR', 'PROBAR', 'ROMPER', 'CORREGIR', 'ACTIVAR', 'MONITOREAR', 'MEDIR'],
}

/* ------------------------------------------------------------------ */
/* 09 · Show me your workflow                                           */
/* ------------------------------------------------------------------ */

export const showMe = {
  title: 'SHOW ME YOUR WORKFLOW',
  ask: '¿Quién quiere enseñarnos el suyo?',
  questions: [
    '¿Qué estás automatizando?',
    '¿Qué problema elimina?',
    '¿Dónde inicia?',
    '¿Cuál es el output?',
    '¿Dónde crees que puede fallar?',
    '¿Ya está activo o todavía está en pruebas?',
  ],
}

/* ------------------------------------------------------------------ */
/* 10 · Workflow Clinic                                                 */
/* ------------------------------------------------------------------ */

/** Las 16 preguntas que el alumno debe poder responder sobre SU workflow. */
export const diagnostic16 = [
  '¿Qué problema estoy resolviendo?',
  '¿Dónde empieza realmente?',
  '¿Qué información necesita?',
  '¿Qué aplicaciones conecta?',
  '¿Qué depende de reglas deterministas?',
  '¿Dónde realmente necesito IA?',
  '¿Dónde puede fallar?',
  '¿Qué pasa cuando recibe datos incorrectos?',
  '¿Qué ocurre si llega información duplicada?',
  '¿Qué sucede si una API falla?',
  '¿Necesito aprobación humana?',
  '¿Cómo veo si funcionó?',
  '¿Dónde reviso logs?',
  '¿Cómo pruebo el workflow?',
  '¿Cuándo puedo activarlo?',
  '¿Cómo sé si me está ahorrando tiempo?',
]

/* ------------------------------------------------------------------ */
/* 11 · Las 5 reglas                                                    */
/* ------------------------------------------------------------------ */

export const rules: { n: string; lines: string[] }[] = [
  { n: '01', lines: ['UN TEMPLATE ES EL PUNTO DE PARTIDA.'] },
  { n: '02', lines: ['QUE CORRA NO SIGNIFICA QUE ESTÉ BIEN.'] },
  { n: '03', lines: ['PRUEBA EL HAPPY PATH.', 'DESPUÉS INTENTA ROMPERLO.'] },
  { n: '04', lines: ['NO TODA AUTOMATIZACIÓN NECESITA IA.'] },
  { n: '05', lines: ['LA COMPLEJIDAD VIVE EN LAS EXCEPCIONES.'] },
]

/* ------------------------------------------------------------------ */
/* 12 · Cierre                                                          */
/* ------------------------------------------------------------------ */

export const cierre = {
  complete: ['AUTOMATIZACIÓN BÁSICA', 'COMPLETE'],
  verbs: ['MAPEASTE.', 'DISEÑASTE.', 'CONECTASTE.', 'PROBASTE.', 'ENTENDISTE LOS LÍMITES.'],
  now: 'Ahora:',
  line1: 'YA NO SE TRATA DE MOVER DATOS.',
  line2: 'EL SIGUIENTE PASO ES CONSTRUIR SISTEMAS QUE PUEDAN DECIDIR.',
  final: ['E1598', 'AUTOMATION SYSTEMS', 'WEEK 09 COMPLETE'],
  button: 'FINALIZAR SESIÓN',
}
