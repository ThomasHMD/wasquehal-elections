import { useState, useEffect } from 'react'
import type { BVResult } from '../utils/types'
import { assetUrl } from '../utils/assetUrl'

// Cache par scrutin : charge seulement ce qui est demandé
const cache = new Map<string, BVResult[]>()
const inFlight = new Map<string, Promise<BVResult[]>>()

function fetchElection(idElection: string): Promise<BVResult[]> {
  const cached = cache.get(idElection)
  if (cached) return Promise.resolve(cached)

  const existing = inFlight.get(idElection)
  if (existing) return existing

  const p = fetch(assetUrl(`/data/elections/${idElection}.json`))
    .then(r => {
      if (!r.ok) throw new Error(`Scrutin ${idElection} introuvable`)
      return r.json() as Promise<BVResult[]>
    })
    .then(data => {
      cache.set(idElection, data)
      inFlight.delete(idElection)
      return data
    })
    .catch(err => {
      inFlight.delete(idElection)
      throw err
    })

  inFlight.set(idElection, p)
  return p
}

interface UseElectionDataResult {
  data: BVResult[]
  loading: boolean
  error: string | null
}

export function useElectionData(idElection: string): UseElectionDataResult {
  const [data, setData] = useState<BVResult[]>(() => cache.get(idElection) ?? [])
  const [loading, setLoading] = useState(!cache.has(idElection))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache.has(idElection)) {
      setData(cache.get(idElection)!)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchElection(idElection)
      .then(d => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err.message ?? 'Erreur'); setLoading(false) } })

    return () => { cancelled = true }
  }, [idElection])

  return { data, loading, error }
}
