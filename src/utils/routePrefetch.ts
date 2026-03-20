// Route → lazy import mapping for prefetching
const routeImports: Record<string, () => Promise<unknown>> = {
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

// Prefetch all routes after initial load (idle time)
export function prefetchAllRoutes() {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      for (const path of Object.keys(routeImports)) {
        prefetchRoute(path)
      }
    })
  } else {
    setTimeout(() => {
      for (const path of Object.keys(routeImports)) {
        prefetchRoute(path)
      }
    }, 2000)
  }
}
