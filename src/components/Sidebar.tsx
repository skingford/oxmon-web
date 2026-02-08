'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  onLogout: () => void
  isOpen: boolean
  onClose: () => void
  onOpenAssistant?: () => void
  stats?: {
    criticalAlerts: number
    offlineAgents: number
  }
}

const navItems = [
  { path: '/dashboard', label: 'Sentinel Core', icon: 'dashboard' },
  { path: '/infrastructure', label: 'Topology Map', icon: 'hub' },
  { path: '/agents', label: 'Agent Grid', icon: 'dns' },
  { path: '/certificates', label: 'Trust Perimeter', icon: 'verified_user' },
  { path: '/alerts', label: 'Incident Hub', icon: 'notifications' },
  { path: '/logs', label: 'Audit Stream', icon: 'list_alt' },
  { path: '/tools', label: 'Config Forge', icon: 'construction' },
  { path: '/help', label: 'Knowledge Hub', icon: 'help' },
]

const Sidebar: React.FC<SidebarProps> = ({
  onLogout,
  isOpen,
  onClose,
  onOpenAssistant,
  stats = { criticalAlerts: 0, offlineAgents: 0 }
}) => {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const navItemClass = (path: string) =>
    `flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer group ${
      isActive(path)
        ? 'bg-[#0071E3]/10 text-[#0071E3] shadow-inner'
        : 'text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
    }`

  const iconClass = (path: string) =>
    `material-symbols-outlined text-[20px] ${isActive(path) ? 'filled' : ''} group-hover:scale-110 transition-transform`

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-20 lg:hidden transition-opacity duration-300 backdrop-blur-sm ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-white border-r border-[#E5E5EA] flex flex-col justify-between shrink-0 h-full transition-transform duration-500 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl lg:shadow-none`}>
        <div className="flex flex-col gap-10 p-8 h-full overflow-hidden">
          <div className="flex items-center gap-4 justify-between lg:justify-start">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-tr from-[#0071E3] to-[#5856D6] rounded-[1rem] w-12 h-12 flex items-center justify-center shadow-xl shadow-[#0071E3]/20 text-white">
                <span className="material-symbols-outlined filled text-[28px]">monitoring</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-[#1D1D1F] text-xl font-black tracking-tighter uppercase leading-none">Oxmon</h1>
                <p className="text-[#86868B] text-[9px] font-black uppercase tracking-widest mt-1 opacity-60">SRE Console</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-[#86868B] p-1 hover:bg-[#F5F5F7] rounded-lg">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto mt-4 custom-scrollbar">
            {navItems.map(item => (
              <Link key={item.path} href={item.path} onClick={handleNavClick} className={navItemClass(item.path)}>
                <div className="flex items-center gap-4">
                  <span className={iconClass(item.path)}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.path === '/agents' && stats.offlineAgents > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-[#FF9F0A]/10 text-[#FF9F0A] text-[9px] font-black border border-[#FF9F0A]/20">{stats.offlineAgents}</span>
                )}
                {item.path === '/alerts' && stats.criticalAlerts > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-[#FF3B30] text-white text-[9px] font-black shadow-lg shadow-[#FF3B30]/30 animate-pulse">{stats.criticalAlerts}</span>
                )}
              </Link>
            ))}

            <div className="mt-6 pt-6 border-t border-[#E5E5EA]">
              <Link href="/settings" onClick={handleNavClick} className={navItemClass('/settings')}>
                <div className="flex items-center gap-4">
                  <span className={iconClass('/settings')}>settings</span>
                  <span>Governance</span>
                </div>
              </Link>
            </div>

            {onOpenAssistant && (
              <button
                onClick={onOpenAssistant}
                className="mt-8 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#5856D6] to-[#0071E3] text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#0071E3]/20 hover:shadow-[#0071E3]/40 hover:scale-[1.02] active:scale-[0.98] transition-all group"
              >
                <span className="material-symbols-outlined text-[20px] animate-pulse">mic</span>
                <span>Neural Link</span>
              </button>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-[#E5E5EA] bg-[#FBFBFD]">
          <div className="flex items-center gap-4 w-full hover:bg-white p-3 rounded-2xl transition-all border border-transparent hover:border-[#E5E5EA] hover:shadow-soft cursor-pointer group relative">
            <div className="w-10 h-10 rounded-2xl bg-[#E5E5EA] overflow-hidden shrink-0 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5F8Dcs3wNWThcZRGAAjFlfnNfVWcMZTTV-v1F_jJ9s0DzxgtaOXhtG4xLBsy5U0zt-_we9BWVW5sAnvPCybjOwe3XNbCK080yggg_knFw0RvUYBEKRFyiEgBYcwxe8SVj2fL3qn6Mpy94ivvgYsOeQVyUYLxAaNOmc3XPSMQQVSgZrm5fogWTnOgfKqva373uAWuxoKd9GVFcO0rwp-9kOGDRSvVD3qP3uBREoaPnL-iIYeAI-l_ZQ0MQmIKcJ2AxD6Jvxck_wGM" alt="Alex Morgan" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black text-[#1D1D1F] truncate uppercase tracking-tight">Alex Morgan</span>
              <span className="text-[9px] text-[#86868B] font-black truncate uppercase tracking-widest opacity-60">Master Admin</span>
            </div>
            <button onClick={onLogout} className="absolute right-3 p-2 text-[#86868B] hover:text-[#FF3B30] rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100" title="Terminate Session">
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
