import { useState, useEffect } from 'react'

export interface SocioIris {
  code_iris: string
  nom_iris: string
  population: number
  age_median: number
  pct_moins_25: number
  pct_plus_65: number
  revenu_median: number
  taux_pauvrete: number
  pct_cadres: number
  pct_ouvriers: number
  pct_employes: number
  pct_sans_diplome: number
  pct_superieur: number
  pct_proprietaires: number
  pct_logement_social: number
  taux_chomage: number
}

export interface BVIrisMapping {
  [bv: string]: { iris_code: string; overlap_pct: number }[]
}

let socioCache: SocioIris[] | null = null
let mappingCache: BVIrisMapping | null = null

export function useSocioData() {
  const [socio, setSocio] = useState<SocioIris[]>(socioCache ?? [])
  const [mapping, setMapping] = useState<BVIrisMapping>(mappingCache ?? {})
  const [loading, setLoading] = useState(!socioCache || !mappingCache)

  useEffect(() => {
    if (socioCache && mappingCache) return

    Promise.all([
      socioCache ? Promise.resolve(socioCache) : fetch('/data/socio-iris.json').then(r => r.json() as Promise<SocioIris[]>),
      mappingCache ? Promise.resolve(mappingCache) : fetch('/data/bv-iris-mapping.json').then(r => r.json() as Promise<BVIrisMapping>),
    ]).then(([s, m]) => {
      socioCache = s
      mappingCache = m
      setSocio(s)
      setMapping(m)
      setLoading(false)
    })
  }, [])

  return { socio, mapping, loading }
}

/** Retourne les données socio de l'IRIS principal d'un BV */
export function getSocioForBV(
  bv: string,
  mapping: BVIrisMapping,
  socio: SocioIris[],
): SocioIris | null {
  const entries = mapping[bv]
  if (!entries?.length) return null
  const primaryIris = entries[0].iris_code
  return socio.find(s => s.code_iris === primaryIris) ?? null
}
