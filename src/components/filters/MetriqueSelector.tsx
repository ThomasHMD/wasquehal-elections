import type { Metrique } from '../../utils/types'
import { FAMILLE_COLORS, FAMILLE_LABELS } from '../../utils/colors'
import type { Famille } from '../../utils/types'

interface NuanceOption {
  nuance: string
  famille: string
  label: string
}

interface MetriqueSelectorProps {
  value: Metrique
  onChange: (m: Metrique) => void
  nuances: NuanceOption[]
}

export default function MetriqueSelector({ value, onChange, nuances }: MetriqueSelectorProps) {
  const currentValue =
    value === 'abstention'
      ? 'abstention'
      : value === 'famille'
        ? 'famille'
        : `candidat:${(value as { type: 'candidat'; nuance: string }).nuance}`

  function handleChange(v: string) {
    if (v === 'abstention') onChange('abstention')
    else if (v === 'famille') onChange('famille')
    else onChange({ type: 'candidat', nuance: v.replace('candidat:', '') })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        Métrique
      </label>
      <select
        value={currentValue}
        onChange={e => handleChange(e.target.value)}
        className="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="abstention">Abstention</option>
        <option value="famille">Famille dominante</option>
        {nuances.length > 0 && (
          <optgroup label="Par candidat / liste">
            {nuances.map(n => (
              <option key={n.nuance} value={`candidat:${n.nuance}`}>
                {n.label}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {/* Légende familles */}
      {(value === 'famille' || (typeof value === 'object' && value.type === 'candidat')) && (
        <div className="mt-2 flex flex-col gap-1">
          <span className="text-xs text-slate-500">Familles politiques</span>
          {(Object.entries(FAMILLE_LABELS) as [Famille, string][]).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-xs text-slate-700">
              <span
                className="inline-block w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: FAMILLE_COLORS[key] }}
              />
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
