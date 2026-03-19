import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { AbstentionPoint } from '../../utils/evolutionHelpers'

const BV_COLORS = ['#94A3B8', '#64748B', '#475569', '#334155', '#1E293B', '#0F172A', '#CBD5E1', '#E2E8F0', '#F1F5F9']
const BV_LABELS: Record<string, string> = {
  bv_0001: 'BV 1', bv_0002: 'BV 2', bv_0003: 'BV 3',
  bv_0004: 'BV 4', bv_0005: 'BV 5', bv_0006: 'BV 6',
  bv_0007: 'BV 7', bv_0008: 'BV 8', bv_0009: 'BV 9',
}

interface AbstentionChartProps {
  data: AbstentionPoint[]
  showBVs: boolean
}

export default function AbstentionChart({ data, showBVs }: AbstentionChartProps) {
  // Détecter les BV présents dans les données
  const bvKeys = data.length > 0
    ? Object.keys(data[0]).filter(k => k.startsWith('bv_'))
    : []

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#64748B' }}
          angle={-30}
          textAnchor="end"
          height={48}
        />
        <YAxis
          domain={[0, 80]}
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 11, fill: '#64748B' }}
          width={40}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value.toFixed(1)} %`,
            BV_LABELS[name] ?? (name === 'moy' ? 'Moyenne' : name),
          ]}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend
          formatter={name => BV_LABELS[name] ?? (name === 'moy' ? 'Moyenne' : name)}
          wrapperStyle={{ fontSize: 11 }}
        />
        <ReferenceLine y={50} stroke="#FCA5A5" strokeDasharray="4 4" label={{ value: '50%', fontSize: 10, fill: '#EF4444' }} />

        {/* Ligne moyenne */}
        <Line
          type="monotone"
          dataKey="moy"
          stroke="#1D4ED8"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#1D4ED8' }}
          activeDot={{ r: 5 }}
          name="moy"
        />

        {/* Lignes par BV */}
        {showBVs && bvKeys.map((bv, i) => (
          <Line
            key={bv}
            type="monotone"
            dataKey={bv}
            stroke={BV_COLORS[i % BV_COLORS.length]}
            strokeWidth={1}
            dot={false}
            strokeOpacity={0.6}
            name={bv}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
