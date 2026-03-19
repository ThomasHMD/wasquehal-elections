import { SCRUTINS } from '../../data/config'
import type { Scrutin } from '../../utils/types'

interface ScrutinSelectorProps {
  value: string
  onChange: (id: string) => void
}

// Grouper par type de scrutin pour l'affichage
const GROUPS: { label: string; types: string[] }[] = [
  { label: 'Municipales', types: ['municipales'] },
  { label: 'Présidentielle', types: ['presidentielle'] },
  { label: 'Législatives', types: ['legislatives'] },
  { label: 'Européennes', types: ['europeenne'] },
  { label: 'Régionales', types: ['regionales'] },
  { label: 'Départementales', types: ['departementales'] },
  { label: 'Cantonales', types: ['cantonal'] },
]

export default function ScrutinSelector({ value, onChange }: ScrutinSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        Scrutin
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm border border-slate-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {GROUPS.map(group => {
          const scrutins = SCRUTINS.filter((s: Scrutin) => group.types.includes(s.type))
          if (scrutins.length === 0) return null
          return (
            <optgroup key={group.label} label={group.label}>
              {scrutins.map((s: Scrutin) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </optgroup>
          )
        })}
      </select>
    </div>
  )
}
