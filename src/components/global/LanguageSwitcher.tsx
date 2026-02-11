'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'
import type { Locale } from '@/lib/i18n'
import { replaceLocaleInPath } from '@/lib/locale'

interface LanguageSwitcherProps {
  compact?: boolean
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { locale, setLocale, t } = useI18n()

  const options: Array<{ value: Locale; label: string }> = [
    { value: 'en', label: t('language.english') },
    { value: 'zh', label: t('language.chinese') },
  ]

  return (
    <div
      className={`flex items-center ${compact ? 'gap-2 px-2.5 py-1.5 rounded-xl' : 'gap-2.5 px-3 py-2 rounded-2xl'} bg-white border border-[#E5E5EA] shadow-sm`}
      aria-label={t('language.current')}
    >
      {!compact && (
        <span className="material-symbols-outlined text-[16px] text-[#86868B]">translate</span>
      )}
      <div className="flex items-center gap-1">
        {options.map((option) => {
          const active = locale === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (option.value === locale) return
                setLocale(option.value)
                router.push(replaceLocaleInPath(pathname || '/', option.value))
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                active
                  ? 'bg-[#0071E3] text-white shadow-md shadow-[#0071E3]/30'
                  : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
              }`}
              aria-pressed={active}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default LanguageSwitcher
