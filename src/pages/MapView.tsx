import { useState, useMemo } from 'react'
import Sidebar from '../components/layout/Sidebar'
import ElectionMap from '../components/map/ElectionMap'
import MapPopup from '../components/map/MapPopup'
import ScrutinSelector from '../components/filters/ScrutinSelector'
import MetriqueSelector from '../components/filters/MetriqueSelector'
import { useElectionData } from '../hooks/useElectionData'
import { useBVGeo } from '../hooks/useGeoData'
import { computeMetricByBV, getNuances } from '../utils/aggregations'
import { SCRUTINS, DEFAULT_SCRUTIN_ID } from '../data/config'
import type { Metrique, BVResult } from '../utils/types'

export default function MapView() {
  const [scrutinId, setScrutinId] = useState(DEFAULT_SCRUTIN_ID)
  const [metrique, setMetrique] = useState<Metrique>('famille')
  const [selectedBV, setSelectedBV] = useState<string | null>(null)

  const { data: electionData, loading: loadingElections, error: errorElections } = useElectionData(scrutinId)
  const { data: geoData, loading: loadingGeo, error: errorGeo } = useBVGeo()

  const metrics = useMemo(
    () => computeMetricByBV(electionData, metrique),
    [electionData, metrique],
  )

  const nuances = useMemo(() => getNuances(electionData), [electionData])

  const selectedBVResult: BVResult | undefined = useMemo(
    () => selectedBV ? electionData.find(bv => bv.bureau_vote === selectedBV) : undefined,
    [selectedBV, electionData],
  )

  const scrutin = SCRUTINS.find(s => s.id === scrutinId)
  const isLoading = loadingElections || loadingGeo
  const error = errorElections ?? errorGeo

  return (
    <>
      <Sidebar>
        <ScrutinSelector value={scrutinId} onChange={id => {
          setScrutinId(id)
          setSelectedBV(null)
        }} />

        <MetriqueSelector
          value={metrique}
          onChange={setMetrique}
          nuances={nuances}
        />

        {/* Infos scrutin */}
        {scrutin && (
          <div className="mt-auto pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
            <div><span className="font-medium">Scrutin :</span> {scrutin.label}</div>
            {!loadingElections && (
              <div><span className="font-medium">Bureaux :</span> {electionData.length} BV{scrutin && scrutin.annee < 2017 ? ' (avant création BV 0016)' : ''}</div>
            )}
          </div>
        )}
      </Sidebar>

      <main className="flex-1 relative overflow-hidden">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
            <div className="text-sm text-slate-500 animate-pulse">Chargement…</div>
          </div>
        )}

        {/* Erreur */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm max-w-sm text-center">
              <p className="font-medium mb-1">Erreur de chargement</p>
              <p className="text-xs text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* Carte */}
        {geoData && (
          <ElectionMap
            geoData={geoData}
            metrics={metrics}
            onBVClick={setSelectedBV}
          />
        )}

        {/* Popup détail BV */}
        {selectedBVResult && (
          <MapPopup
            bvResult={selectedBVResult}
            onClose={() => setSelectedBV(null)}
          />
        )}

        {/* Titre scrutin flottant */}
        {scrutin && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm shadow px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 pointer-events-none">
            {scrutin.label}
          </div>
        )}
      </main>
    </>
  )
}
