'use client'

import { memo } from 'react'
import { useI18n } from '@/contexts/I18nContext'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  icon: string
  label: string
  active?: boolean
  badge?: number
}

const Sidebar = memo<SidebarProps>(({ isOpen, onClose }) => {
  const { t, tr } = useI18n()

  const navItems: NavItem[] = [
    { icon: 'dashboard', label: t('view.dashboard'), active: true },
    { icon: 'dns', label: t('view.agents') },
    { icon: 'monitoring', label: tr('Metrics') },
    { icon: 'warning', label: t('view.alerts'), badge: 3 },
    { icon: 'verified_user', label: t('view.certificates') },
  ]

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-20 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-[#E5E5EA] flex flex-col h-full shrink-0 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 flex items-center gap-3 justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0073e6] to-blue-600 flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Oxmon</h1>
              <p className="text-xs text-slate-500 font-medium">Admin Console</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-slate-500 p-1 hover:bg-slate-100 rounded-lg"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                item.active ? 'bg-[#0073e6]/10 text-[#0073e6]' : 'text-slate-600'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${item.active ? 'filled' : ''}`}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge ? <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">{item.badge}</span> : null}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E5E5EA]">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-100">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5F8Dcs3wNWThcZRGAAjFlfnNfVWcMZTTV-v1F_jJ9s0DzxgtaOXhtG4xLBsy5U0zt-_we9BWVW5sAnvPCybjOwe3XNbCK080yggg_knFw0RvUYBEKRFyiEgBYcwxe8SVj2fL3qn6Mpy94ivvgYsOeQVyUYLxAaNOmc3XPSMQQVSgZrm5fogWTnOgfKqva373uAWuxoKd9GVFcO0rwp-9kOGDRSvVD3qP3uBREoaPnL-iIYeAI-l_ZQ0MQmIKcJ2AxD6Jvxck_wGM"
                alt="Administrator"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Administrator</p>
              <p className="text-xs text-slate-500 truncate">admin@oxmon.io</p>
            </div>
          </div>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#E5E5EA] text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
