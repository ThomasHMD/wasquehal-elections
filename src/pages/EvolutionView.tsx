import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import Sidebar from '../components/layout/Sidebar'

const AbstentionChart = lazy(() => import('../components/charts/AbstentionChart'))
const FamilleEvolutionChart = lazy(() => import('../components/charts/FamilleEvolutionChart'))
const BVHeatmap = lazy(() => import('../components/charts/BVHeatmap'))
import { useParticipationData } from '../hooks/useParticipationData'
import {
  buildAbstentionSeries,
  buildHeatmapData,
  SCRUTIN_TYPES,
} from '../utils/evolutionHelpers'
import { assetUrl } from '../utils/assetUrl'
import { FAMILLE_COLORS, FAMILLE_LABELS } from '../utils/colors'
import type { Famille } from '../utils/types'
import type { FamillePoint } from '../utils/evolutionHelpers'

interface CandidatEntry {
  nom: string
  prenom: string
  nuance: string
  famille: Famille
  voix: number
  pourcentage: number
}

interface ElectionCandidats {
  id_election: string
  scrutin: string
  annee: number
  tour: number
  total_exprimes: number
  candidats: CandidatEntry[]
}

// Charge les données familles pré-agrégées (6 KB au lieu de 732 KB)
let famillesCache: FamillePoint[] | null = null

function useFamillesData() {
  const [data, setData] = useState<FamillePoint[]>(famillesCache ?? [])
  const [loading, setLoading] = useState(!famillesCache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (famillesCache) return
    fetch(assetUrl('/data/familles-evolution.json'))
      .then(r => {
        if (!r.ok) throw new Error('Données familles introuvables')
        return r.json() as Promise<FamillePoint[]>
      })
      .then(d => { famillesCache = d; setData(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  return { data, loading, error }
}

// Charge les données candidats pré-agrégées
let candidatsCache: ElectionCandidats[] | null = null

function useCandidatsData() {
  const [data, setData] = useState<ElectionCandidats[]>(candidatsCache ?? [])
  const [loading, setLoading] = useState(!candidatsCache)

  useEffect(() => {
    if (candidatsCache) return
    fetch(assetUrl('/data/candidats-evolution.json'))
      .then(r => r.json() as Promise<ElectionCandidats[]>)
      .then(d => { candidatsCache = d; setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { data, loading }
}

type TabId = 'abstention' | 'familles' | 'heatmap'

const TABS: { id: TabId; label: string }[] = [
  { id: 'abstention', label: 'Abstention' },
  { id: 'familles', label: 'Familles politiques' },
  { id: 'heatmap', label: 'Heatmap BV' },
]

export default function EvolutionView() {
  const [tab, setTab] = useState<TabId>('abstention')
  const [scrutinFilter, setScrutinFilter] = useState('presidentielle')
  const [showBVs, setShowBVs] = useState(false)

  const { data: participation, loading: loadingParticipation } = useParticipationData()
  const { data: famillesRaw, loading: loadingFamilles } = useFamillesData()
  const { data: candidatsRaw } = useCandidatsData()

  const abstentionSeries = useMemo(
    () => buildAbstentionSeries(participation, scrutinFilter),
    [participation, scrutinFilter],
  )

  // Filtrer les données familles pré-agrégées
  const familleSeries = useMemo((): FamillePoint[] => {
    const filtered = scrutinFilter === 'all'
      ? famillesRaw
      : famillesRaw.filter(d => d.scrutin === scrutinFilter)
    return filtered.map(d => ({
      ...d,
      label: `${d.annee}${(d.tour as number) === 2 ? ' T2' : ' T1'}`,
    }))
  }, [famillesRaw, scrutinFilter])

  // Filtrer les candidats par type de scrutin
  const candidatsFiltered = useMemo(() => {
    if (scrutinFilter === 'all') return candidatsRaw
    return candidatsRaw.filter(e => e.scrutin === scrutinFilter)
  }, [candidatsRaw, scrutinFilter])

  const heatmapData = useMemo(
    () => buildHeatmapData(participation, scrutinFilter),
    [participation, scrutinFilter],
  )

  const isLoading = loadingParticipation || (tab === 'familles' && loadingFamilles)

  return (
    <>
      <Sidebar>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Type de scrutin
          </label>
          <select
            value={scrutinFilter}
            onChange={e => setScrutinFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SCRUTIN_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {tab === 'abstention' && (
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showBVs}
              onChange={e => setShowBVs(e.target.checked)}
              className="rounded"
            />
            Afficher les BV individuels
          </label>
        )}

        <div className="mt-auto pt-4 border-t border-slate-200 text-xs text-slate-400 space-y-1">
          <p>Données 1999–2026</p>
          {!isLoading && <p>{abstentionSeries.length} scrutins</p>}
        </div>
      </Sidebar>

      <main className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm animate-pulse">
            Chargement…
          </div>
        ) : (
          <div className="max-w-4xl space-y-6">
            {/* Onglets */}
            <div className="flex gap-1 border-b border-slate-200 pb-0">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                    tab === t.id
                      ? 'bg-white border border-b-white border-slate-200 text-slate-900 -mb-px'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Contenu */}
            {tab === 'abstention' && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">
                  Évolution du taux d'abstention
                  {scrutinFilter !== 'all' && ` — ${SCRUTIN_TYPES.find(t => t.value === scrutinFilter)?.label}`}
                </h2>
                {abstentionSeries.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">Aucune donnée pour ce filtre</p>
                ) : (
                  <Suspense fallback={<div className="text-sm text-slate-400 animate-pulse text-center py-8">Chargement graphique…</div>}>
                    <AbstentionChart data={abstentionSeries} showBVs={showBVs} />
                  </Suspense>
                )}
              </div>
            )}

            {tab === 'familles' && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-700 mb-1">
                  Répartition des familles politiques
                  {scrutinFilter !== 'all' && ` — ${SCRUTIN_TYPES.find(t => t.value === scrutinFilter)?.label}`}
                </h2>
                <p className="text-xs text-slate-400 mb-4">% des votes exprimés, cumulé à 100 %</p>
                {familleSeries.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">Aucune donnée pour ce filtre</p>
                ) : (
                  <Suspense fallback={<div className="text-sm text-slate-400 animate-pulse text-center py-8">Chargement graphique…</div>}>
                    <FamilleEvolutionChart data={familleSeries} />
                  </Suspense>
                )}
              </div>
            )}

            {/* Détail candidats par élection */}
            {tab === 'familles' && candidatsFiltered.length > 0 && (
              <div className="space-y-4">
                {candidatsFiltered.map(election => {
                  const label = `${election.annee}${election.tour === 2 ? ' T2' : ' T1'}`
                  return (
                    <div key={election.id_election} className="bg-white rounded-lg border border-slate-200 p-4">
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">
                        {label} — {SCRUTIN_TYPES.find(t => t.value === election.scrutin)?.label ?? election.scrutin}
                      </h3>
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-3 py-1.5 text-slate-600 font-semibold">Candidat</th>
                            <th className="text-left px-3 py-1.5 text-slate-600 font-semibold">Nuance</th>
                            <th className="text-left px-3 py-1.5 text-slate-600 font-semibold">Famille</th>
                            <th className="text-right px-3 py-1.5 text-slate-600 font-semibold">Voix</th>
                            <th className="text-right px-3 py-1.5 text-slate-600 font-semibold">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {election.candidats.filter(c => c.voix > 0).map((c, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-1.5 text-slate-700">
                                {c.prenom || c.nom
                                  ? `${c.prenom ?? ''} ${c.nom ?? ''}`.trim()
                                  : c.nuance}
                              </td>
                              <td className="px-3 py-1.5 text-slate-500">{c.nuance}</td>
                              <td className="px-3 py-1.5">
                                <span className="inline-flex items-center gap-1">
                                  <span
                                    className="w-2 h-2 rounded-sm inline-block"
                                    style={{ backgroundColor: FAMILLE_COLORS[c.famille] }}
                                  />
                                  {FAMILLE_LABELS[c.famille] ?? c.famille}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 text-right text-slate-600">{c.voix.toLocaleString('fr')}</td>
                              <td className="px-3 py-1.5 text-right font-medium text-slate-700">{c.pourcentage.toFixed(1)} %</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            )}

            {tab === 'heatmap' && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-700 mb-1">
                  Heatmap abstention par bureau de vote
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Chaque cellule = taux d'abstention. Survoler pour le détail.
                </p>
                <Suspense fallback={<div className="text-sm text-slate-400 animate-pulse text-center py-8">Chargement heatmap…</div>}>
                  <BVHeatmap
                    cells={heatmapData.cells}
                    elections={heatmapData.elections}
                    labels={heatmapData.labels}
                    bvs={heatmapData.bvs}
                  />
                </Suspense>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
