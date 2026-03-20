import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'

const MapView = lazy(() => import('./pages/MapView'))
const EvolutionView = lazy(() => import('./pages/EvolutionView'))
const SocioView = lazy(() => import('./pages/SocioView'))
const CompareView = lazy(() => import('./pages/CompareView'))
const AboutView = lazy(() => import('./pages/AboutView'))

const Loading = () => (
  <div className="flex-1 flex items-center justify-center text-slate-400 text-sm animate-pulse">
    Chargement…
  </div>
)

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/carte" replace />} />
          <Route path="carte" element={<Suspense fallback={<Loading />}><MapView /></Suspense>} />
          <Route path="evolution" element={<Suspense fallback={<Loading />}><EvolutionView /></Suspense>} />
          <Route path="profil" element={<Suspense fallback={<Loading />}><SocioView /></Suspense>} />
          <Route path="comparer" element={<Suspense fallback={<Loading />}><CompareView /></Suspense>} />
          <Route path="methodologie" element={<Suspense fallback={<Loading />}><AboutView /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
