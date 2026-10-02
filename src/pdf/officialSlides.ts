/**
 * Presentación OFICIAL de Top Learning.
 * El contenido se muestra siempre desde el PDF original; aquí solo vive
 * su ubicación y el índice de títulos (tal como aparecen en el documento).
 */
export const OFFICIAL_PDF_FILE = 'E1598_Semana9_Parte2_desde_Concluimos.pdf'
export const OFFICIAL_PDF_URL = `${import.meta.env.BASE_URL}assets/${OFFICIAL_PDF_FILE}`

export const officialSlideTitles = [
  'Concluimos la primer parte de nuestra sesión',
  'Límites del Nivel Básico',
  'Transición al Nivel 2',
  'Ecosistema de herramientas',
  'Zapier',
  'Make',
  'n8n',
  'Tabla comparativa',
  'Estrategia de implementación',
  'Conclusiones',
  'Bibliografías',
  'Semana 9 completada',
]

export const OFFICIAL_SLIDE_COUNT = officialSlideTitles.length

export function slideTitle(page: number) {
  return officialSlideTitles[page - 1] ?? `Diapositiva ${page}`
}
