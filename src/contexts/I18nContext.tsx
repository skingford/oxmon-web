'use client'

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import {
  DEFAULT_LOCALE,
  getPreferredLocale,
  getViewLabel,
  localizeToastMessage,
  persistLocale,
  tr,
  type Locale,
  type TranslationKey,
  t,
} from '@/lib/i18n'

type TranslationValues = Record<string, string | number>

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, values?: TranslationValues) => string
  tr: (value: string, values?: TranslationValues) => string
  viewLabel: (rawView: string) => string
  localizeToast: (message: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)
    persistLocale(nextLocale)
  }, [])

  useEffect(() => {
    const preferredLocale = getPreferredLocale()
    setLocaleState((currentLocale) => (currentLocale === preferredLocale ? currentLocale : preferredLocale))
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = locale
  }, [locale])

  const contextValue = useMemo<I18nContextType>(() => {
    return {
      locale,
      setLocale,
      t: (key, values) => t(locale, key, values),
      tr: (value, values) => tr(locale, value, values),
      viewLabel: (rawView) => getViewLabel(locale, rawView),
      localizeToast: (message) => localizeToastMessage(locale, message),
    }
  }, [locale, setLocale])

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
}
