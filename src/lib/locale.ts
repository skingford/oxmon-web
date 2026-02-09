export type Locale = 'en' | 'zh'

export const SUPPORTED_LOCALES: Locale[] = ['en', 'zh']
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE_KEY = 'ox_locale'

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'zh'
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) return DEFAULT_LOCALE
  return value.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function stripLocalePrefix(pathname: string): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  const segments = normalizedPath.split('/')
  const localeSegment = segments[1]

  if (!isLocale(localeSegment)) {
    return normalizedPath
  }

  const strippedPath = `/${segments.slice(2).join('/')}`
  return strippedPath === '/' ? '/' : strippedPath.replace(/\/+$/, '') || '/'
}

export function buildLocalePath(locale: Locale, pathname: string): string {
  const normalizedPath = stripLocalePrefix(pathname)
  if (normalizedPath === '/') {
    return `/${locale}`
  }
  return `/${locale}${normalizedPath}`
}

export function replaceLocaleInPath(pathname: string, locale: Locale): string {
  return buildLocalePath(locale, pathname)
}
