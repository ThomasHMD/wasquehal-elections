import { NavLink } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/carte', label: 'Carte' },
  { to: '/evolution', label: 'Évolution' },
  { to: '/profil', label: 'Profil socio' },
  { to: '/comparer', label: 'Comparer' },
  { to: '/methodologie', label: 'Méthodologie' },
]

export default function Header() {
  return (
    <header className="bg-slate-900 text-white shadow-md flex items-center gap-6 px-4 h-12 shrink-0">
      <span className="font-semibold text-sm tracking-tight whitespace-nowrap">
        Wasquehal Élections
      </span>
      <nav className="flex gap-1 overflow-x-auto">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
