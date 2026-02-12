import { NextResponse, type NextRequest } from "next/server"

const LOCALES = ["zh", "en"] as const

type AppLocale = (typeof LOCALES)[number]

const ROOT_ROUTES = [
  "dashboard",
  "agents",
  "alerts",
  "certificates",
  "login",
  "metrics",
  "notifications",
  "profile",
  "system",
  "whitelist",
] as const

const ROOT_ROUTE_SET = new Set<string>(ROOT_ROUTES)

function resolveDefaultLocale(): AppLocale {
  const localeCandidate = process.env.NEXT_PUBLIC_DEFAULT_LOCALE?.toLowerCase()

  if (localeCandidate === "zh" || localeCandidate === "en") {
    return localeCandidate
  }

  return "zh"
}

const DEFAULT_LOCALE = resolveDefaultLocale()

function resolveLocale(pathname: string): AppLocale | null {
  const matched = pathname.match(/^\/(zh|en)(?:\/|$)/)

  if (!matched) {
    return null
  }

  return matched[1] as AppLocale
}

function hasLocalePrefix(pathname: string) {
  return resolveLocale(pathname) !== null
}

function isLocaleCandidate(segment: string) {
  return /^[a-z]{2,5}$/i.test(segment)
}

function normalizePathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return `/${DEFAULT_LOCALE}/dashboard`
  }

  const [firstSegment, secondSegment] = segments

  if (hasLocalePrefix(pathname)) {
    return pathname
  }

  if (isLocaleCandidate(firstSegment) && (!secondSegment || ROOT_ROUTE_SET.has(secondSegment))) {
    if (!secondSegment) {
      return `/${DEFAULT_LOCALE}/dashboard`
    }

    return `/${DEFAULT_LOCALE}/${segments.slice(1).join("/")}`
  }

  return `/${DEFAULT_LOCALE}${pathname}`
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const locale = resolveLocale(pathname)

  if (locale) {
    if (pathname === `/${locale}` || pathname === `/${locale}/`) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = `/${locale}/dashboard`
      return NextResponse.redirect(redirectUrl)
    }

    return NextResponse.next()
  }

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = normalizePathname(pathname)

  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
}
