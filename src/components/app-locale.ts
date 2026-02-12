export type AppLocale = "zh" | "en"

export const DEFAULT_APP_LOCALE: AppLocale = "zh"

export function stripLocalePrefix(pathname: string) {
  const matched = pathname.match(/^\/(zh|en)(\/.*|$)/)

  if (!matched) {
    return pathname || "/"
  }

  const suffix = matched[2]
  return suffix ? suffix : "/"
}

export function resolveAppLocale(
  pathname: string,
  fallbackLocale: AppLocale = DEFAULT_APP_LOCALE
): AppLocale {
  const matched = pathname.match(/^\/(zh|en)(\/|$)/)

  if (matched?.[1] === "en") {
    return "en"
  }

  if (matched?.[1] === "zh") {
    return "zh"
  }

  return fallbackLocale
}

export function withLocalePrefix(pathname: string, locale: AppLocale): string {
  const normalizedPath = stripLocalePrefix(pathname)

  if (normalizedPath === "/") {
    return `/${locale}`
  }

  return `/${locale}${normalizedPath}`
}
