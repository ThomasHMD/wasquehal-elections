import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import MapView from './pages/MapView'
import EvolutionView from './pages/EvolutionView'
import SocioView from './pages/SocioView'
import CompareView from './pages/CompareView'
import AboutView from './pages/AboutView'

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
