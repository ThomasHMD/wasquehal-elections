import type { ParticipationEntry } from '../hooks/useParticipationData'
import type { BVResult, Famille } from './types'
import { FAMILLE_COLORS } from './colors'

export const SCRUTIN_TYPES: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'presidentielle', label: 'Présidentielles' },
  { value: 'legislatives', label: 'Législatives' },
  { value: 'europeenne', label: 'Européennes' },
  { value: 'municipales', label: 'Municipales' },
  { value: 'regionales', label: 'Régionales' },
  { value: 'departementales', label: 'Départementales' },
  { value: 'cantonal', label: 'Cantonales' },
]

export interface AbstentionPoint {
  id_election: string
  label: string            // "2022 T2"
  annee: number
  tour: number
  scrutin: string
  moy: number              // moyenne tous BV
  [bv: string]: number | string   // taux par BV
}

/**
 * Construit les points de la courbe d'abstention.
 * Retourne un tableau trié par date, avec moyenne et valeur par BV.
 */
export function buildAbstentionSeries(
  data: ParticipationEntry[],
  scrutinFilter: string,
): AbstentionPoint[] {
  const filtered = scrutinFilter === 'all'
    ? data
    : data.filter(d => d.scrutin === scrutinFilter)

  // Grouper par id_election
  const grouped = new Map<string, ParticipationEntry[]>()
  for (const entry of filtered) {
    const arr = grouped.get(entry.id_election) ?? []
    arr.push(entry)
    grouped.set(entry.id_election, arr)
  }

  const points: AbstentionPoint[] = []
  for (const [id, entries] of grouped) {
    const first = entries[0]
    const moy = entries.reduce((s, e) => s + e.taux_abstention, 0) / entries.length
    const point: AbstentionPoint = {
      id_election: id,
      label: `${first.annee}${entries.some(e => e.tour === 2) || first.tour === 2 ? ` T${first.tour}` : ''}`,
      annee: first.annee,
      tour: first.tour,
      scrutin: first.scrutin,
      moy: Math.round(moy * 10) / 10,
    }
    for (const e of entries) {
      point[`bv_${e.bureau_vote}`] = Math.round(e.taux_abstention * 10) / 10
    }
    points.push(point)
  }

  return points.sort((a, b) => a.annee - b.annee || a.tour - b.tour)
}

export interface FamillePoint {
  id_election: string
  label: string
  annee: number
  tour: number
  scrutin: string
  [famille: string]: number | string
}

const FAMILLES: Famille[] = ['extreme_gauche', 'gauche', 'centre', 'droite', 'extreme_droite', 'divers']

export { FAMILLE_COLORS, FAMILLES }

/**
 * Construit les points de la stacked area des familles.
 * Pour chaque scrutin : % voix moyen par famille (moyenné sur tous les BV).
 */
export function buildFamilleSeries(
  elections: BVResult[],
  scrutinFilter: string,
): FamillePoint[] {
  const filtered = scrutinFilter === 'all'
    ? elections
    : elections.filter(e => e.scrutin === scrutinFilter)

  const grouped = new Map<string, BVResult[]>()
  for (const bv of filtered) {
    const arr = grouped.get(bv.id_election) ?? []
    arr.push(bv)
    grouped.set(bv.id_election, arr)
  }

  const points: FamillePoint[] = []
  for (const [id, bvList] of grouped) {
    const first = bvList[0]
    const point: FamillePoint = {
      id_election: id,
      label: `${first.annee}${first.tour === 2 ? ' T2' : first.tour === 1 && bvList.length > 0 ? ' T1' : ''}`,
      annee: first.annee,
      tour: first.tour,
      scrutin: first.scrutin,
    }

    // Total voix par famille sur tous les BV
    const totaux: Record<string, number> = {}
    let totalVoix = 0
    for (const bv of bvList) {
      for (const c of bv.candidats) {
        totaux[c.famille] = (totaux[c.famille] ?? 0) + c.voix
        totalVoix += c.voix
      }
    }

    for (const f of FAMILLES) {
      point[f] = totalVoix > 0
        ? Math.round(((totaux[f] ?? 0) / totalVoix) * 1000) / 10  // 1 décimale
        : 0
    }

    points.push(point)
  }

  return points.sort((a, b) => a.annee - b.annee || a.tour - b.tour)
}

export interface HeatmapCell {
  bv: string
  id_election: string
  label: string
  annee: number
  taux: number
}

export function buildHeatmapData(
  data: ParticipationEntry[],
  scrutinFilter: string,
): { cells: HeatmapCell[]; elections: string[]; labels: Record<string, string>; bvs: string[] } {
  const filtered = scrutinFilter === 'all'
    ? data
    : data.filter(d => d.scrutin === scrutinFilter)

  const electionsSet = new Set<string>()
  const bvsSet = new Set<string>()
  const labels: Record<string, string> = {}

  for (const e of filtered) {
    electionsSet.add(e.id_election)
    bvsSet.add(e.bureau_vote)
    labels[e.id_election] = `${e.annee}${e.tour === 2 ? ' T2' : ' T1'}`
  }

  // Trier chronologiquement
  const elections = Array.from(electionsSet).sort()
  const bvs = Array.from(bvsSet).sort()

  const cells: HeatmapCell[] = filtered.map(e => ({
    bv: e.bureau_vote,
    id_election: e.id_election,
    label: labels[e.id_election],
    annee: e.annee,
    taux: Math.round(e.taux_abstention * 10) / 10,
  }))

  return { cells, elections, labels, bvs }
}
