import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts'
import type { SocioIris } from '../../hooks/useSocioData'

interface SocioRadarProps {
  iris: SocioIris
}

export default function SocioRadar({ iris }: SocioRadarProps) {
  const data = [
    { label: 'Cadres', value: iris.pct_cadres, max: 40 },
    { label: 'Sup.', value: iris.pct_superieur, max: 50 },
    { label: 'Propriét.', value: iris.pct_proprietaires, max: 100 },
    { label: 'Log. social', value: iris.pct_logement_social, max: 80 },
    { label: 'Pauvreté', value: iris.taux_pauvrete, max: 40 },
    { label: 'Chômage', value: iris.taux_chomage, max: 30 },
    { label: '<25 ans', value: iris.pct_moins_25, max: 50 },
  ].map(d => ({
    label: d.label,
    value: Math.round((d.value / d.max) * 100),   // normalisé 0–100
    raw: d.value,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="#E2E8F0" />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} />
        <Radar
          dataKey="value"
          stroke="#2563EB"
          fill="#2563EB"
          fillOpacity={0.2}
          dot={{ r: 3, fill: '#2563EB' }}
        />
        <Tooltip
          formatter={(_: number, __: string, props: { payload?: { label: string; raw: number } }) => [
            `${props.payload?.raw?.toFixed(1) ?? '–'} %`,
            props.payload?.label ?? '',
          ]}
          contentStyle={{ fontSize: 12 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
