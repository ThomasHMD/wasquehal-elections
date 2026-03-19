import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import type { FamillePoint } from '../../utils/evolutionHelpers'
import { FAMILLE_COLORS, FAMILLES } from '../../utils/evolutionHelpers'
import { FAMILLE_LABELS } from '../../utils/colors'
import type { Famille } from '../../utils/types'

interface FamilleEvolutionChartProps {
  data: FamillePoint[]
}

export default function FamilleEvolutionChart({ data }: FamilleEvolutionChartProps) {
  // Filtrer les familles qui ont au moins une valeur > 0
  const activeFamilles = FAMILLES.filter(f =>
    data.some(d => (d[f] as number) > 0)
  )

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }} stackOffset="expand">
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#64748B' }}
          angle={-30}
          textAnchor="end"
          height={48}
        />
        <YAxis
          tickFormatter={v => `${Math.round(v * 100)}%`}
          tick={{ fontSize: 11, fill: '#64748B' }}
          width={40}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${(value * 100).toFixed(1)} %`,
            FAMILLE_LABELS[name as Famille] ?? name,
          ]}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend
          formatter={name => FAMILLE_LABELS[name as Famille] ?? name}
          wrapperStyle={{ fontSize: 11 }}
        />
        {activeFamilles.map(f => (
          <Area
            key={f}
            type="monotone"
            dataKey={f}
            stackId="1"
            stroke={FAMILLE_COLORS[f]}
            fill={FAMILLE_COLORS[f]}
            fillOpacity={0.85}
            name={f}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
