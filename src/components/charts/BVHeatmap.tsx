import { useMemo } from 'react'
import type { HeatmapCell } from '../../utils/evolutionHelpers'
import { getAbstentionColor } from '../../utils/colors'

interface BVHeatmapProps {
  cells: HeatmapCell[]
  elections: string[]
  labels: Record<string, string>
  bvs: string[]
}

export default function BVHeatmap({ cells, elections, labels, bvs }: BVHeatmapProps) {
  // Index rapide
  const cellMap = useMemo(() => {
    const map = new Map<string, HeatmapCell>()
    for (const c of cells) {
      map.set(`${c.bv}_${c.id_election}`, c)
    }
    return map
  }, [cells])

  if (elections.length === 0) {
    return <div className="text-center text-slate-400 text-sm py-8">Aucune donnée</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white px-2 py-1 text-slate-600 font-medium text-right pr-3 min-w-16">BV</th>
            {elections.map(id => (
              <th key={id} className="px-1 py-1 text-slate-500 font-normal whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 64 }}>
                {labels[id] ?? id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bvs.map(bv => (
            <tr key={bv}>
              <td className="sticky left-0 bg-white px-2 py-0.5 text-slate-600 font-medium text-right pr-3">
                BV {parseInt(bv)}
              </td>
              {elections.map(id => {
                const cell = cellMap.get(`${bv}_${id}`)
                return (
                  <td
                    key={id}
                    className="w-7 h-7 text-center align-middle cursor-default"
                    style={{ backgroundColor: cell ? getAbstentionColor(cell.taux) : '#F8FAFC' }}
                    title={cell ? `BV ${parseInt(bv)} — ${labels[id]} : ${cell.taux.toFixed(1)}% abstention` : '–'}
                  >
                    <span className="sr-only">{cell?.taux.toFixed(0) ?? '–'}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Légende */}
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
        <span>Abstention :</span>
        <span>faible</span>
        <div className="flex gap-px">
          {[0, 15, 30, 45, 60, 75, 90].map(v => (
            <span key={v} className="w-5 h-3 inline-block" style={{ backgroundColor: getAbstentionColor(v) }} />
          ))}
        </div>
        <span>élevée</span>
      </div>
    </div>
  )
}
