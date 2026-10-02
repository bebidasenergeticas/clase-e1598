type Kind = 'official' | 'teacher' | 'adaptation'

const labels: Record<Kind, string> = {
  official: 'Oficial Top Learning',
  teacher: 'Complemento del profesor',
  adaptation: 'Adaptación pedagógica',
}

export function Badge({ kind, children }: { kind: Kind; children?: React.ReactNode }) {
  return <span className={`badge badge--${kind}`}>{children ?? labels[kind]}</span>
}
