import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { buildLocalePath, isLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/locale'
import { getPageMetaForPath } from '@/lib/seo-metadata'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const LEGACY_ROUTE_ALIASES: Record<string, string> = {

}

function absoluteUrl(pathname: string): string {
  return `${SITE_URL.replace(/\/$/, '')}${pathname}`
}

function normalizeLegacyRoute(pathname: string): string {
  return LEGACY_ROUTE_ALIASES[pathname] ?? pathname
}

function resolvePathForLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const localeInPath = segments[0]

  if (localeInPath && isLocale(localeInPath)) {
    const rest = segments.slice(1).join('/')
    const localizedPath = rest ? `/${rest}` : '/dashboard'
    return normalizeLegacyRoute(localizedPath)
  }

  const fallbackPath = pathname === '/' ? '/dashboard' : pathname
  return normalizeLegacyRoute(fallbackPath)
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>
  }
): Promise<Metadata> {
  const { locale } = await props.params

  if (!isLocale(locale)) {
    return {}
  }

  const requestHeaders = await headers()
  const currentPathname = requestHeaders.get('x-current-pathname') ?? `/${locale}/dashboard`
  const targetPath = resolvePathForLocale(currentPathname)
  const pageMeta = getPageMetaForPath(targetPath, locale)

  const languages: Record<string, string> = {}
  for (const supportedLocale of SUPPORTED_LOCALES) {
    languages[supportedLocale] = absoluteUrl(buildLocalePath(supportedLocale, targetPath))
  }

  languages['x-default'] = absoluteUrl(buildLocalePath('en', targetPath))

  return {
    title: pageMeta.title,
    description: pageMeta.description,
    alternates: {
      canonical: absoluteUrl(buildLocalePath(locale, targetPath)),
      languages,
    },
  }
}

export default async function LocaleLayout(
  props: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
  }
) {
  const { children, params } = props
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  return children
}

export function generateStaticParams(): Array<{ locale: Locale }> {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}
