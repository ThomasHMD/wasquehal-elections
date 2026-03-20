import { useState, useMemo, lazy, Suspense } from 'react'
import Sidebar from '../components/layout/Sidebar'

const SocioRadar = lazy(() => import('../components/charts/SocioRadar'))
import { useSocioData } from '../hooks/useSocioData'
import { useElectionData } from '../hooks/useElectionData'
import { DEFAULT_SCRUTIN_ID, SCRUTINS } from '../data/config'
import ScrutinSelector from '../components/filters/ScrutinSelector'

export default function SocioView() {
  const [selectedIris, setSelectedIris] = useState<string | null>(null)
  const [scrutinId, setScrutinId] = useState(DEFAULT_SCRUTIN_ID)

  const { socio, mapping, loading } = useSocioData()
  const { data: elections } = useElectionData(scrutinId)

  const scrutin = SCRUTINS.find(s => s.id === scrutinId)

  // Calculer le taux d'abstention moyen par IRIS (via mapping BV→IRIS)
  // Moyenne pondérée : abstention_iris = Σ(taux_bv * overlap) / Σ(overlap)
  const abstentionByIris = useMemo(() => {
    const result = new Map<string, { weightedSum: number; totalWeight: number }>()
    for (const bv of elections) {
      const taux = bv.inscrits > 0 ? (bv.abstentions / bv.inscrits) * 100 : 0
      const entries = mapping[bv.bureau_vote] ?? []
      for (const { iris_code, overlap_pct } of entries) {
        const prev = result.get(iris_code) ?? { weightedSum: 0, totalWeight: 0 }
        result.set(iris_code, {
          weightedSum: prev.weightedSum + taux * overlap_pct,
          totalWeight: prev.totalWeight + overlap_pct,
        })
      }
    }
    return new Map(
      Array.from(result.entries()).map(([k, v]) => [k, v.totalWeight > 0 ? v.weightedSum / v.totalWeight : 0])
    )
  }, [elections, mapping])

  const selectedSocio = selectedIris ? socio.find(s => s.code_iris === selectedIris) : null

  const INDICATEURS = [
    { key: 'population' as const, label: 'Population', unit: '' },
    { key: 'revenu_median' as const, label: 'Revenu médian', unit: ' €' },
    { key: 'taux_pauvrete' as const, label: 'Taux de pauvreté', unit: ' %' },
    { key: 'taux_chomage' as const, label: 'Taux de chômage', unit: ' %' },
    { key: 'pct_cadres' as const, label: 'Cadres', unit: ' %' },
    { key: 'pct_ouvriers' as const, label: 'Ouvriers', unit: ' %' },
    { key: 'pct_superieur' as const, label: 'Diplômés supérieur', unit: ' %' },
    { key: 'pct_logement_social' as const, label: 'Logement social', unit: ' %' },
  ]

  return (
    <>
      <Sidebar>
        <ScrutinSelector value={scrutinId} onChange={setScrutinId} />
        <div className="text-xs text-slate-400 mt-2">
          Cliquer sur un IRIS pour voir son profil
        </div>
      </Sidebar>

      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm animate-pulse">Chargement…</div>
        ) : (
          <div className="max-w-5xl space-y-6">
            <h1 className="text-lg font-semibold text-slate-800">Profil socio-démographique par IRIS</h1>

            {/* Tableau IRIS */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">IRIS</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600">Pop.</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600">Rev. médian</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600">Pauvreté</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600">Chômage</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600">Log. social</th>
                    {scrutin && <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600">Abstention</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {socio.map(iris => {
                    const abstention = abstentionByIris.get(iris.code_iris)
                    return (
                      <tr
                        key={iris.code_iris}
                        onClick={() => setSelectedIris(selectedIris === iris.code_iris ? null : iris.code_iris)}
                        className={`cursor-pointer transition-colors ${
                          selectedIris === iris.code_iris ? 'bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-800">{iris.nom_iris}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{iris.population != null ? iris.population.toLocaleString('fr') : '–'}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{iris.revenu_median != null ? `${iris.revenu_median.toLocaleString('fr')} €` : '–'}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{iris.taux_pauvrete != null ? `${iris.taux_pauvrete.toFixed(1)} %` : '–'}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{iris.taux_chomage != null ? `${iris.taux_chomage.toFixed(1)} %` : '–'}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{iris.pct_logement_social != null ? `${iris.pct_logement_social.toFixed(1)} %` : '–'}</td>
                        {scrutin && (
                          <td className="px-3 py-2.5 text-right">
                            {abstention !== undefined ? (
                              <span className={`font-medium ${abstention > 40 ? 'text-red-600' : abstention > 30 ? 'text-orange-500' : 'text-green-600'}`}>
                                {abstention.toFixed(1)} %
                              </span>
                            ) : <span className="text-slate-300">–</span>}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Détail IRIS sélectionné */}
            {selectedSocio && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h2 className="text-sm font-semibold text-slate-700 mb-3">
                    {selectedSocio.nom_iris} — Radar socio
                  </h2>
                  <Suspense fallback={<div className="text-sm text-slate-400 animate-pulse text-center py-8">Chargement radar…</div>}>
                    <SocioRadar iris={selectedSocio} />
                  </Suspense>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h2 className="text-sm font-semibold text-slate-700 mb-3">Indicateurs détaillés</h2>
                  <dl className="space-y-2">
                    {INDICATEURS.map(({ key, label, unit }) => (
                      <div key={key} className="flex justify-between text-sm">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="font-medium text-slate-800">
                          {typeof selectedSocio[key] === 'number'
                            ? key === 'population' || key === 'revenu_median'
                              ? selectedSocio[key].toLocaleString('fr') + unit
                              : selectedSocio[key].toFixed(1) + unit
                            : '–'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
