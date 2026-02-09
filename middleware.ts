import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_KEY, normalizeLocale } from '@/lib/locale'

const STATIC_FILE_PATTERN = /\.[^/]+$/

function getRequestLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_KEY)?.value
  if (isLocale(cookieLocale)) return cookieLocale

  const acceptLanguage = request.headers.get('accept-language')
  return normalizeLocale(acceptLanguage)
}

function withLocaleCookie(response: NextResponse, locale: 'en' | 'zh') {
  response.cookies.set(LOCALE_COOKIE_KEY, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return response
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    STATIC_FILE_PATTERN.test(pathname)
  ) {
    return NextResponse.next()
  }

  const localeFromPath = pathname.split('/')[1]

  if (isLocale(localeFromPath)) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-current-pathname', pathname)
    requestHeaders.set('x-current-locale', localeFromPath)
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    return withLocaleCookie(response, localeFromPath)
  }

  const locale = getRequestLocale(request) ?? DEFAULT_LOCALE
  const localizedPath = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`
  const redirectUrl = new URL(`${localizedPath}${search}`, request.url)
  const response = NextResponse.redirect(redirectUrl)
  return withLocaleCookie(response, locale)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
