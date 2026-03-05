import type { AppLocale } from "@/components/app-locale"

export function formatDateTimeByLocale(
  value: string | null | undefined,
  locale: AppLocale,
  fallback = "-",
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) {
    return fallback
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", options)
}
