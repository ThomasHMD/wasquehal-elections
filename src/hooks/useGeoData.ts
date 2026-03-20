import { useState, useEffect } from 'react'
import { assetUrl } from '../utils/assetUrl'

// Cache global GeoJSON
const geoCache = new Map<string, GeoJSON.FeatureCollection>()

async function fetchGeo(url: string): Promise<GeoJSON.FeatureCollection> {
  const cached = geoCache.get(url)
  if (cached) return cached
  const r = await fetch(url)
  if (!r.ok) throw new Error(`GeoJSON introuvable: ${url}`)
  const data: GeoJSON.FeatureCollection = await r.json()
  geoCache.set(url, data)
  return data
}

interface UseGeoDataResult {
  data: GeoJSON.FeatureCollection | null
  loading: boolean
  error: string | null
}

export function useBVGeo(): UseGeoDataResult {
  return useGeoFile(assetUrl('/geo/bv.geojson'))
}

export function useIrisGeo(): UseGeoDataResult {
  return useGeoFile(assetUrl('/geo/iris.geojson'))
}

function useGeoFile(url: string): UseGeoDataResult {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchGeo(url)
      .then(geo => {
        if (!cancelled) {
          setData(geo)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message ?? 'Erreur de chargement GeoJSON')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [url])

  return { data, loading, error }
}
