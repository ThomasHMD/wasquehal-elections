import type { BVResult, Famille, Metrique } from './types'
import { FAMILLE_COLORS, getAbstentionColor } from './colors'

export interface BVMetric {
  codeBV: string       // ex: "0001"
  value: number        // 0–100 pour abstention/candidat, ou identifiant famille
  color: string
  label: string
}

/**
 * Calcule la métrique par bureau de vote pour une liste de résultats.
 * Retourne une Map<codeBV, BVMetric>.
 */
export function computeMetricByBV(
  results: BVResult[],
  metrique: Metrique,
): Map<string, BVMetric> {
  const map = new Map<string, BVMetric>()

  for (const bv of results) {
    const codeBV = bv.bureau_vote

    const tauxAbstention = bv.inscrits > 0
      ? (bv.abstentions / bv.inscrits) * 100
      : 0

    if (metrique === 'abstention') {
      const value = tauxAbstention
      map.set(codeBV, {
        codeBV,
        value,
        color: getAbstentionColor(value),
        label: `${value.toFixed(1)} % d'abstention`,
      })
    } else if (metrique === 'famille') {
      // Famille dominante = candidat avec le plus de voix
      const top = bv.candidats.reduce(
        (max, c) => (c.voix > max.voix ? c : max),
        bv.candidats[0],
      )
      if (!top) continue
      const famille = top.famille as Famille
      map.set(codeBV, {
        codeBV,
        value: top.pourcentage,
        color: FAMILLE_COLORS[famille] ?? '#6B7280',
        label: `${top.nom ?? top.nuance} — ${top.pourcentage.toFixed(1)} %`,
      })
    } else if (metrique.type === 'candidat') {
      const candidat = bv.candidats.find(c => c.nuance === metrique.nuance)
      if (!candidat) continue
      const value = candidat.pourcentage
      const famille = candidat.famille as Famille
      map.set(codeBV, {
        codeBV,
        value,
        color: FAMILLE_COLORS[famille] ?? '#6B7280',
        label: `${candidat.nom ?? candidat.nuance} — ${value.toFixed(1)} %`,
      })
    }
  }

  return map
}

/** Retourne les nuances disponibles dans un jeu de résultats */
export function getNuances(results: BVResult[]): { nuance: string; famille: string; label: string }[] {
  const seen = new Map<string, { nuance: string; famille: string; label: string; totalVoix: number }>()
  for (const bv of results) {
    for (const c of bv.candidats) {
      const existing = seen.get(c.nuance)
      if (!existing) {
        seen.set(c.nuance, {
          nuance: c.nuance,
          famille: c.famille,
          label: c.nom ? `${c.prenom ?? ''} ${c.nom}`.trim() : c.nuance,
          totalVoix: c.voix,
        })
      } else {
        existing.totalVoix += c.voix
      }
    }
  }
  return Array.from(seen.values())
    .sort((a, b) => b.totalVoix - a.totalVoix)
    .map(({ nuance, famille, label }) => ({ nuance, famille, label }))
}
