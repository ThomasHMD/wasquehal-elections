import type { BVResult } from '../../utils/types'
import { FAMILLE_COLORS, FAMILLE_LABELS } from '../../utils/colors'
import type { Famille } from '../../utils/types'

interface MapPopupProps {
  bvResult: BVResult
  onClose: () => void
}

export default function MapPopup({ bvResult, onClose }: MapPopupProps) {
  const tauxAbstention = bvResult.inscrits > 0
    ? ((bvResult.abstentions / bvResult.inscrits) * 100).toFixed(1)
    : '–'

  const tauxParticipation = bvResult.inscrits > 0
    ? ((bvResult.votants / bvResult.inscrits) * 100).toFixed(1)
    : '–'

  // Trier les candidats par voix décroissant
  const candidats = [...bvResult.candidats].sort((a, b) => b.voix - a.voix)

  return (
    <div className="absolute bottom-4 left-4 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-10 overflow-hidden">
      <div className="bg-slate-800 text-white px-4 py-2.5 flex justify-between items-center">
        <span className="font-semibold text-sm">Bureau {bvResult.bureau_vote}</span>
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white text-lg leading-none"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Stats participation */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 rounded p-2">
            <div className="text-xs text-slate-500">Inscrits</div>
            <div className="font-semibold text-slate-800 text-sm">{bvResult.inscrits.toLocaleString('fr')}</div>
          </div>
          <div className="bg-slate-50 rounded p-2">
            <div className="text-xs text-slate-500">Participation</div>
            <div className="font-semibold text-slate-800 text-sm">{tauxParticipation} %</div>
          </div>
          <div className="bg-slate-50 rounded p-2">
            <div className="text-xs text-slate-500">Abstention</div>
            <div className="font-semibold text-slate-800 text-sm">{tauxAbstention} %</div>
          </div>
        </div>

        {/* Résultats candidats */}
        <div className="space-y-1.5">
          {candidats.slice(0, 8).map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: FAMILLE_COLORS[c.famille as Famille] ?? '#6B7280' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-1">
                  <span className="text-xs text-slate-700 truncate">
                    {c.nom ? `${c.prenom ?? ''} ${c.nom}`.trim() : c.nuance}
                  </span>
                  <span className="text-xs font-medium text-slate-900 shrink-0">
                    {c.pourcentage.toFixed(1)} %
                  </span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full mt-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(c.pourcentage, 100)}%`,
                      backgroundColor: FAMILLE_COLORS[c.famille as Famille] ?? '#6B7280',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {candidats.length > 8 && (
            <p className="text-xs text-slate-400 text-center">
              + {candidats.length - 8} autres
            </p>
          )}
        </div>

        {/* Libellé famille */}
        {candidats[0] && (
          <div className="text-xs text-slate-500 border-t border-slate-100 pt-2">
            En tête : {FAMILLE_LABELS[candidats[0].famille as Famille] ?? candidats[0].famille}
          </div>
        )}
      </div>
    </div>
  )
}
