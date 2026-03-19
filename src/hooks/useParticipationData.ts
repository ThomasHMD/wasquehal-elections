import { useState, useEffect } from 'react'

export interface ParticipationEntry {
  id_election: string
  scrutin: string
  annee: number
  tour: number
  bureau_vote: string
  taux_abstention: number
}

let cache: ParticipationEntry[] | null = null
let promise: Promise<ParticipationEntry[]> | null = null

function fetchParticipation(): Promise<ParticipationEntry[]> {
  if (cache) return Promise.resolve(cache)
  if (!promise) {
    promise = fetch('/data/participation.json')
      .then(r => r.json() as Promise<ParticipationEntry[]>)
      .then(data => { cache = data; return data })
  }
  return promise
}

export function useParticipationData() {
  const [data, setData] = useState<ParticipationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchParticipation()
      .then(d => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
