'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAppContext } from '@/contexts/AppContext'
import { useI18n } from '@/contexts/I18nContext'
import { buildLocalePath, stripLocalePrefix } from '@/lib/locale'
import GlobalSearch from './GlobalSearch'
import CommandPalette from './CommandPalette'
import LanguageSwitcher from './LanguageSwitcher'

const Header: React.FC = () => {
  const pathname = usePathname()
  const { agents, alerts } = useAppContext()
  const { locale, t, viewLabel } = useI18n()

  const systemHealth = 100 - (alerts.filter(a => a.severity === 'Critical').length * 15) - (agents.filter(a => a.status === 'Offline').length * 5)

  const normalizedPath = stripLocalePrefix(pathname || '/dashboard')
  const currentView = normalizedPath.split('/').pop() || 'dashboard'

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(true)
      }
      if (e.key === 'Escape') setIsCommandPaletteOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <header className="h-20 border-b border-[#E5E5EA] bg-white/70 backdrop-blur-2xl flex items-center justify-between px-10 shrink-0 z-10">
        <div className="flex items-center gap-6">
          <button onClick={() => {
            const event = new CustomEvent('toggle-mobile-menu')
            window.dispatchEvent(event)
          }} className="lg:hidden text-[#1D1D1F] p-1 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.25em] text-[#86868B]">
            <Link href={buildLocalePath(locale, '/dashboard')} className="flex items-center gap-2 cursor-pointer group">
              <span className="group-hover:text-[#0071E3] transition-colors">{t('header.sentinel')}</span>
            </Link>
            <span className="opacity-20">/</span>
            <span className="text-[#1D1D1F] tracking-[0.3em] font-black">{viewLabel(currentView)}</span>
          </div>
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 border border-[#E5E5EA] rounded-full shadow-inner ml-4">
            <div className={`w-2 h-2 rounded-full shadow-lg ${systemHealth > 90 ? 'bg-[#34C759] shadow-[#34C759]/40' : systemHealth > 70 ? 'bg-[#FF9F0A] shadow-[#FF9F0A]/40' : 'bg-[#FF3B30] shadow-[#FF3B30]/40'} animate-pulse`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-[#86868B]">{t('header.clusterHealth', { value: systemHealth })}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <LanguageSwitcher compact />
          <button onClick={() => setIsCommandPaletteOpen(true)} className="flex items-center gap-3 px-4 py-2.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#86868B] hover:text-[#1D1D1F] hover:bg-white hover:shadow-soft transition-all group shadow-sm">
            <span className="material-symbols-outlined text-[18px] group-hover:text-[#0071E3] transition-colors">terminal</span>
            <span>{t('header.command')}</span>
            <span className="bg-white border border-[#E5E5EA] rounded-lg px-2 py-1 opacity-50 ml-1">⌘K</span>
          </button>
          <GlobalSearch />
        </div>
      </header>

      {isCommandPaletteOpen && (
        <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} />
      )}
    </>
  )
}

export default Header
