'use client'

import React, { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'
import type { Locale } from '@/lib/i18n'
import { replaceLocaleInPath } from '@/lib/locale'
import { Button } from '@/components/ui/button'
import { Check, ChevronDown, Languages } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface LanguageSwitcherProps {
  compact?: boolean
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { locale, setLocale, t } = useI18n()

  const options = useMemo<Array<{ value: Locale; label: string }>>(() => [
    { value: 'en', label: t('language.english') },
    { value: 'zh', label: t('language.chinese') },
  ], [t])

  const currentOption = options.find((option) => option.value === locale) ?? options[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`border-[#E5E5EA] bg-white shadow-sm ${compact ? 'h-8 gap-1 px-2.5 text-[10px]' : 'h-10 gap-2 px-3 text-[11px]'} font-black uppercase tracking-widest text-[#1D1D1F]`}
          aria-label={t('language.current')}
        >
          {!compact && <Languages className="size-4 text-[#86868B]" />}
          <span>{currentOption.label}</span>
          <ChevronDown className="size-4 text-[#86868B]" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className={compact ? 'min-w-28' : 'min-w-36'}>
        {options.map((option) => {
          const active = locale === option.value

          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => {
                if (active) return
                setLocale(option.value)
                router.push(replaceLocaleInPath(pathname || '/', option.value))
              }}
              className={`flex items-center justify-between text-[11px] font-semibold ${active ? 'text-[#0071E3]' : ''}`}
            >
              <span>{option.label}</span>
              {active ? <Check className="size-3.5" /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageSwitcher
