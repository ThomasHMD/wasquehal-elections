// Route → lazy import mapping for prefetching on hover
export const routeImports: Record<string, () => Promise<unknown>> = {
  '/carte': () => import('../pages/MapView'),
  '/evolution': () => import('../pages/EvolutionView'),
  '/profil': () => import('../pages/SocioView'),
  '/comparer': () => import('../pages/CompareView'),
  '/methodologie': () => import('../pages/AboutView'),
}

const prefetched = new Set<string>()

export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return
  prefetched.add(path)
  routeImports[path]?.()
}
