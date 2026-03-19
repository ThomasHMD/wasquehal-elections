import type { ReactNode } from 'react'

interface SidebarProps {
  children: ReactNode
}

export default function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="w-72 shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto p-4 flex flex-col gap-4">
      {children}
    </aside>
  )
}
