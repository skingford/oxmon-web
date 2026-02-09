'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/contexts/AppContext'
import { useI18n } from '@/contexts/I18nContext'
import { buildLocalePath } from '@/lib/locale'

const GlobalSearch: React.FC = () => {
  const router = useRouter()
  const { agents, certificates, alerts } = useAppContext()
  const { locale, t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchResults = searchTerm.trim() === '' ? [] : [
    ...agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.ip.includes(searchTerm)).map(a => ({ type: 'Agent', id: a.id, label: a.name, sub: a.ip })),
    ...certificates.filter(c => c.domain.toLowerCase().includes(searchTerm.toLowerCase())).map(c => ({ type: 'Certificate', id: c.id, label: c.domain, sub: c.issuer })),
    ...alerts.filter(a => a.message.toLowerCase().includes(searchTerm.toLowerCase()) || a.source.toLowerCase().includes(searchTerm.toLowerCase())).map(a => ({ type: 'Alert', id: a.id, label: a.source, sub: a.message }))
  ]

  const resultTypeLabel: Record<string, string> = {
    Agent: t('search.type.agent'),
    Certificate: t('search.type.certificate'),
    Alert: t('search.type.alert'),
  }

  const handleResultClick = (type: string) => {
    const route = type === 'Agent' ? '/agents' : type === 'Certificate' ? '/certificates' : '/alerts'
    router.push(buildLocalePath(locale, route))
    setIsSearchFocused(false)
    setSearchTerm('')
  }

  return (
    <div className="relative" ref={searchRef}>
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#C1C1C1] text-[20px]">search</span>
      <input
        type="text"
        placeholder={t('search.placeholder')}
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setIsSearchFocused(true) }}
        onFocus={() => setIsSearchFocused(true)}
        className="pl-12 pr-6 py-2.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-[11px] font-bold w-64 focus:ring-4 focus:ring-[#0071E3]/5 focus:bg-white transition-all outline-none"
      />
      {isSearchFocused && searchTerm && (
        <div className="absolute top-full right-0 mt-3 w-96 bg-white rounded-[2rem] shadow-2xl border border-[#E5E5EA] overflow-hidden z-50 animate-fade-in-up">
          <div className="py-2">
            {searchResults.length > 0 ? searchResults.map((result) => (
              <button key={`${result.type}-${result.id}`} onClick={() => handleResultClick(result.type)} className="w-full px-8 py-4 hover:bg-[#F5F5F7] flex items-center gap-4 text-left group transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#86868B] group-hover:bg-[#0071E3] group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-[20px]">{result.type === 'Agent' ? 'dns' : result.type === 'Certificate' ? 'verified_user' : 'notifications'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-tight truncate">{result.label}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#86868B] mt-1 opacity-60">{resultTypeLabel[result.type] ?? result.type} • {result.sub}</p>
                </div>
              </button>
            )) : <div className="p-12 text-center text-[#86868B] text-[10px] font-black uppercase tracking-widest opacity-40">{t('search.noResults')}</div>}
          </div>
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
