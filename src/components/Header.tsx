'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'
import { stripLocalePrefix } from '@/lib/locale'

const Header: React.FC = () => {
  const pathname = usePathname()
  const { viewLabel, tr } = useI18n()

  const normalizedPath = stripLocalePrefix(pathname || '/dashboard')
  const currentView = normalizedPath.split('/').pop() || 'dashboard'

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-[#E5E5EA] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const event = new CustomEvent('toggle-mobile-menu')
            window.dispatchEvent(event)
          }}
          className="lg:hidden text-slate-500 p-1 -ml-1 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {currentView === 'dashboard' ? tr('Dashboard Overview') : viewLabel(currentView)}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <div className="h-4 w-px bg-slate-300" />
        <span className="text-sm text-slate-500 font-medium">v0.1.0</span>
      </div>
    </header>
  )
}

export default Header
