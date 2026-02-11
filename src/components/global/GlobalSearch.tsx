'use client'

import React, { useDeferredValue, useMemo, useState } from 'react'
import { Bell, Search, Server, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAppDataContext } from '@/contexts/AppContext'
import { useI18n } from '@/contexts/I18nContext'
import { buildLocalePath } from '@/lib/locale'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'

const GlobalSearch: React.FC = () => {
  const router = useRouter()
  const { agents, domains, alerts } = useAppDataContext()
  const { locale, t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const normalizedTerm = deferredSearchTerm.trim().toLowerCase()

  const searchResults = useMemo(() => {
    if (!normalizedTerm) {
      return []
    }

    const results = [
      ...agents
        .filter((agent) => agent.name.toLowerCase().includes(normalizedTerm) || agent.ip.includes(normalizedTerm))
        .map((agent) => ({ type: 'Agent', id: agent.id, label: agent.name, sub: agent.ip })),
      ...domains
        .filter((certificate) => certificate.domain.toLowerCase().includes(normalizedTerm))
        .map((certificate) => ({ type: 'Certificate', id: certificate.id, label: certificate.domain, sub: certificate.issuer })),
      ...alerts
        .filter((alert) => alert.message.toLowerCase().includes(normalizedTerm) || alert.source.toLowerCase().includes(normalizedTerm))
        .map((alert) => ({ type: 'Alert', id: alert.id, label: alert.source, sub: alert.message })),
    ]

    return results.slice(0, 30)
  }, [agents, domains, alerts, normalizedTerm])

  const resultTypeLabel: Record<string, string> = {
    Agent: t('search.type.agent'),
    Certificate: t('search.type.certificate'),
    Alert: t('search.type.alert'),
  }

  const handleResultClick = (type: string) => {
    const route = type === 'Agent' ? '/agents' : type === 'Certificate' ? '/domains' : '/alerts'
    router.push(buildLocalePath(locale, route))
    setIsSearchOpen(false)
    setSearchTerm('')
  }

  const getResultIcon = (type: string) => {
    if (type === 'Agent') return Server
    if (type === 'Certificate') return ShieldCheck
    return Bell
  }

  return (
    <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#C1C1C1]" />
          <Input
            type="text"
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={(event) => {
              const nextValue = event.target.value
              setSearchTerm(nextValue)
              setIsSearchOpen(nextValue.trim().length > 0)
            }}
            onFocus={() => {
              if (searchTerm.trim().length > 0) {
                setIsSearchOpen(true)
              }
            }}
            className="pl-12 pr-6 py-2.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-[11px] font-bold w-64 focus:ring-4 focus:ring-[#0071E3]/5 focus:bg-white transition-all outline-none"
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-96 rounded-[2rem] border border-[#E5E5EA] bg-white p-0 shadow-2xl"
      >
        <Command shouldFilter={false} className="rounded-[2rem] bg-white">
          <CommandList className="max-h-[420px] py-2">
            {searchResults.length > 0 ? (
              searchResults.map((result) => {
                const ResultIcon = getResultIcon(result.type)

                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.type}-${result.id}`}
                    onSelect={() => handleResultClick(result.type)}
                    className="w-full px-8 py-4 text-left transition-colors data-[selected=true]:bg-[#F5F5F7]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F7] text-[#86868B]">
                        <ResultIcon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black uppercase tracking-tight">{result.label}</p>
                        <p className="mt-1 truncate text-[9px] font-black uppercase tracking-widest text-[#86868B] opacity-60">{resultTypeLabel[result.type] ?? result.type} • {result.sub}</p>
                      </div>
                    </div>
                  </CommandItem>
                )
              })
            ) : (
              <CommandEmpty className="p-12 text-center text-[10px] font-black uppercase tracking-widest text-[#86868B] opacity-40">
                {t('search.noResults')}
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default GlobalSearch
