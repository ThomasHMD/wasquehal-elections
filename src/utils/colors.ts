import type { Famille } from './types'

export const FAMILLE_COLORS: Record<Famille, string> = {
  extreme_gauche: '#7F1D1D',
  gauche: '#DC2626',
  centre: '#D97706',
  droite: '#2563EB',
  extreme_droite: '#1E3A5F',
  divers: '#6B7280',
}

export const FAMILLE_LABELS: Record<Famille, string> = {
  extreme_gauche: 'Extrême gauche',
  gauche: 'Gauche',
  centre: 'Centre',
  droite: 'Droite',
  extreme_droite: 'Extrême droite',
  divers: 'Divers',
}

/** Palette séquentielle abstention : gris clair → rouge foncé */
export const ABSTENTION_COLORS = [
  '#F9FAFB',
  '#FEE2E2',
  '#FECACA',
  '#FCA5A5',
  '#F87171',
  '#EF4444',
  '#DC2626',
  '#B91C1C',
]

/** Retourne une couleur d'abstention interpolée entre 0 et 100 */
export function getAbstentionColor(taux: number): string {
  const clamped = Math.max(0, Math.min(100, taux))
  const index = Math.floor((clamped / 100) * (ABSTENTION_COLORS.length - 1))
  return ABSTENTION_COLORS[Math.min(index, ABSTENTION_COLORS.length - 1)]
}
