import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'

const MapView = lazy(() => import('./pages/MapView'))
const EvolutionView = lazy(() => import('./pages/EvolutionView'))
const SocioView = lazy(() => import('./pages/SocioView'))
const CompareView = lazy(() => import('./pages/CompareView'))
const AboutView = lazy(() => import('./pages/AboutView'))


export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/carte" replace />} />
            <Route path="carte" element={<MapView />} />
            <Route path="evolution" element={<EvolutionView />} />
            <Route path="profil" element={<SocioView />} />
            <Route path="comparer" element={<CompareView />} />
            <Route path="methodologie" element={<AboutView />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
