import { useState, useMemo } from 'react'
import Sidebar from '../components/layout/Sidebar'
import ElectionMap from '../components/map/ElectionMap'
import { useElectionData } from '../hooks/useElectionData'
import { useBVGeo } from '../hooks/useGeoData'
import { computeMetricByBV } from '../utils/aggregations'
import { SCRUTINS, DEFAULT_SCRUTIN_ID } from '../data/config'
import ScrutinSelector from '../components/filters/ScrutinSelector'
import MetriqueSelector from '../components/filters/MetriqueSelector'
import type { Metrique } from '../utils/types'

const SECOND_DEFAULT = '2017_pres_t2'

export default function CompareView() {
  const [scrutinA, setScrutinA] = useState(DEFAULT_SCRUTIN_ID)
  const [scrutinB, setScrutinB] = useState(SECOND_DEFAULT)
  const [metrique, setMetrique] = useState<Metrique>('abstention')

  const { data: electionsA, loading: loadingA } = useElectionData(scrutinA)
  const { data: electionsB, loading: loadingB } = useElectionData(scrutinB)
  const { data: geoData, loading: loadingGeo } = useBVGeo()

  const metricsA = useMemo(() => computeMetricByBV(electionsA, metrique), [electionsA, metrique])
  const metricsB = useMemo(() => computeMetricByBV(electionsB, metrique), [electionsB, metrique])

  const scrutinALabel = SCRUTINS.find(s => s.id === scrutinA)?.label ?? scrutinA
  const scrutinBLabel = SCRUTINS.find(s => s.id === scrutinB)?.label ?? scrutinB

  const nuancesA = useMemo(() => {
    const seen = new Map<string, { nuance: string; famille: string; label: string }>()
    for (const bv of electionsA)
      for (const c of bv.candidats)
        if (!seen.has(c.nuance))
          seen.set(c.nuance, { nuance: c.nuance, famille: c.famille, label: c.nom ? `${c.prenom ?? ''} ${c.nom}`.trim() : c.nuance })
    return Array.from(seen.values())
  }, [electionsA])

  // Calcul des deltas par BV (si métrique = abstention)
  const deltas = useMemo(() => {
    if (metrique !== 'abstention') return null
    const map = new Map<string, number>()
    for (const [bv, mA] of metricsA) {
      const mB = metricsB.get(bv)
      if (mB !== undefined) map.set(bv, mA.value - mB.value)
    }
    return map
  }, [metricsA, metricsB, metrique])

  const isLoading = loadingA || loadingB || loadingGeo

  return (
    <>
      <Sidebar>
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Scrutin A</span>
            </div>
            <ScrutinSelector value={scrutinA} onChange={setScrutinA} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Scrutin B</span>
            </div>
            <ScrutinSelector value={scrutinB} onChange={setScrutinB} />
          </div>
        </div>

        <MetriqueSelector value={metrique} onChange={setMetrique} nuances={nuancesA} />
      </Sidebar>

      <main className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1 text-slate-400 text-sm animate-pulse">Chargement…</div>
        ) : (
          <>
            {/* Double carte côte à côte */}
            <div className="flex flex-1 overflow-hidden border-b border-slate-200">
              <div className="flex-1 relative border-r border-slate-200">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none shadow">
                  A — {scrutinALabel}
                </div>
                {geoData && <ElectionMap geoData={geoData} metrics={metricsA} />}
              </div>
              <div className="flex-1 relative">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none shadow">
                  B — {scrutinBLabel}
                </div>
                {geoData && <ElectionMap geoData={geoData} metrics={metricsB} />}
              </div>
            </div>

            {/* Tableau comparatif */}
            <div className="shrink-0 overflow-x-auto p-4 max-h-52">
              <table className="text-xs w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-slate-600 font-semibold">BV</th>
                    <th className="text-right px-3 py-2 text-blue-600 font-semibold">A</th>
                    <th className="text-right px-3 py-2 text-emerald-600 font-semibold">B</th>
                    {deltas && <th className="text-right px-3 py-2 text-slate-600 font-semibold">Δ (A−B)</th>}
                    {metrique === 'famille' && <th className="px-3 py-2 text-slate-600 font-semibold">Famille A</th>}
                    {metrique === 'famille' && <th className="px-3 py-2 text-slate-600 font-semibold">Famille B</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from(metricsA.entries()).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([bv, mA]) => {
                    const mB = metricsB.get(bv)
                    const delta = deltas?.get(bv)
                    return (
                      <tr key={bv} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-medium text-slate-700">BV {parseInt(bv)}</td>
                        <td className="px-3 py-1.5 text-right">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: mA.color }} />
                            {mA.value.toFixed(1)} %
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {mB ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: mB.color }} />
                              {mB.value.toFixed(1)} %
                            </span>
                          ) : '–'}
                        </td>
                        {deltas && (
                          <td className={`px-3 py-1.5 text-right font-medium ${
                            (delta ?? 0) > 2 ? 'text-red-600' : (delta ?? 0) < -2 ? 'text-green-600' : 'text-slate-500'
                          }`}>
                            {delta !== undefined ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)} pp` : '–'}
                          </td>
                        )}
                        {metrique === 'famille' && (
                          <>
                            <td className="px-3 py-1.5">
                              <span className="inline-flex items-center gap-1">
                                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: mA.color }} />
                                {mA.label.split('—')[0].trim()}
                              </span>
                            </td>
                            <td className="px-3 py-1.5">
                              {mB && (
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: mB.color }} />
                                  {mB.label.split('—')[0].trim()}
                                </span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  )
}
